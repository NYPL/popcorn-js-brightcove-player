(function( window, Popcorn ) {
  // A global callback for brightcove
  window.onBrightcovePlayerAPIReady = function(playerid) {
    if ( onBrightcovePlayerAPIReady.waiting[playerid] != undefined ) {
      onBrightcovePlayerAPIReady.waiting[playerid]();
    }
  };
  window.onBrightcovePlayerAPIError = function(evt) {
    for ( var i = 0; i < onBrightcovePlayerAPIError.waiting.length; i++ ) {
      onBrightcovePlayerAPIError.waiting[ i ](evt);
    }
  };

  // existing brightcove references can break us.
  // remove it and use the one we can trust.)
  if ( window.brightcove ) {
    window.quarantineBC = window.brightcove;
    window.brightcove = null;
  }

  onBrightcovePlayerAPIReady.waiting = {};
  onBrightcovePlayerAPIError.waiting = [];

  var scriptLoaded = false,
      loading = false;

  Popcorn.player( "brightcove", {
    _canPlayType: function( nodeName, url ) {

      return typeof url === "string" && (/(?:http:\/\/www\.|http:\/\/link\.|http:\/\/|www\.|\.|^)(brightcove)/).test( url ) && nodeName.toLowerCase() !== "video";
    },
    _setup: function( options ) {

      var media = this,
          autoPlay = false,
          container = document.createElement( "div" ),
          currentTime = 0,
          paused = true,
          seekTime = 0,
          firstGo = true,
          seeking = false,
          fragmentStart = 0,
          canPlay = false,

          // state code for volume changed polling
          lastMuted = false,
          lastVolume = 100,
          playerQueue = Popcorn.player.playerQueue();
      
      var createProperties = function() {

        Popcorn.player.defineProperty( media, "currentTime", {
          set: function( val ) {

            if ( options.destroyed ) {
              return;
            }

            val = Number( val );
            
            if ( isNaN ( val ) ) {
              return;
            }
            
            currentTime = val;            
            seeking = true;
            media.dispatchEvent( "seeking" );  
            
            options.brightcoveObject.seek( val );           
            
          },
          get: function() {

            return currentTime;
          }
        });

        Popcorn.player.defineProperty( media, "paused", {
          get: function() {

            return paused;
          }
        });

        Popcorn.player.defineProperty( media, "muted", {
          set: function( val ) {

            if ( options.destroyed ) {

              return val;
            }

            if ( options.brightcoveObject.isMuted() !== val ) {

              if ( val ) {

                options.brightcoveObject.mute(true);
              } else {

                options.brightcoveObject.mute(false);
              }

              lastMuted = options.brightcoveObject.isMuted();
              media.dispatchEvent( "volumechange" );
            }

            return options.brightcoveObject.isMuted();
          },
          get: function() {

            if ( options.destroyed ) {

              return 0;
            }

            return options.brightcoveObject.isMuted();
          }
        });

        Popcorn.player.defineProperty( media, "volume", {
          set: function( val ) {

            if ( options.destroyed ) {

              return val;
            }

            if ( options.brightcoveObject.getVolume() !== val ) {

              options.brightcoveObject.setVolume( val );
              lastVolume = options.brightcoveObject.getVolume();
              media.dispatchEvent( "volumechange" );
            }

            return options.brightcoveObject.getVolume();
          },
          get: function() {

            if ( options.destroyed ) {

              return 0;
            }

            return options.brightcoveObject.getVolume();
          }
        });
        
        Popcorn.player.defineProperty( media, "buffered", {
          get: function() {
            return {
              length: 1,
              start: function(index){
                var position = options.brightcoveObject.getVideoPosition(),
                    buffer = options.brightcoveObject.getBackBufferLength(),
                    start = Math.floor( position - buffer );
                return start < 0 ? 0 : start;
              },
              end: function(index){
                var position = options.brightcoveObject.getVideoPosition(),
                    buffer = options.brightcoveObject.getBufferLength(),
                    end = Math.floor( position + buffer );
                return isNaN( end ) ? 0 : end;
              }
            };
          }
        });

        media.play = function() {

          if ( options.destroyed ) {

            return;
          }

          paused = false;
          playerQueue.add(function() {

            if ( !options.brightcoveObject.isPlaying() ) {
              seeking = false;
              options.brightcoveObject.play();
              
            } else {
              playerQueue.next();
              
            }
          });
        };

        media.pause = function() {

          if ( options.destroyed ) {

            return;
          }

          paused = true;
          playerQueue.add(function() {
            
            if ( options.brightcoveObject.isPlaying() ) {
              options.brightcoveObject.pause(true);
              
            } else {
              playerQueue.next();
              
            }
            
            
          });
        };
        
        
      };
      
      var scriptReady = function(){
        scriptLoaded = true;        
        
        var src, src_query, params, query=[], atts, bcpid, bckey, bctid, bcpid, playerVars, objectId,
            expressInstallSwfurl = null, flashvars = null, flashVersion = '9.0.0';
            
        // container attributes
        container.id = media.id + Popcorn.guid();
        container['data-object'] = 'object'+container.id;
        onBrightcovePlayerAPIReady.waiting[ container['data-object'] ] = brightcoveInit;
        onBrightcovePlayerAPIError.waiting.push( brightcoveError );
        
        // Retrieve player parameters from src
        bcpid = /^.*(?:\/|bcpid)(.{13})/.exec( media.src )[ 1 ];
        bckey = /^.*(?:\/|bckey=)(.{50})/.exec( media.src )[ 1 ];
        bctid = /^.*(?:\/|bctid=)(.{13})/.exec( media.src )[ 1 ];
        
        // Retrieve url queries
        src_query = ( media.src.split( "?" )[ 1 ] || "" )
                    .replace( /bckey=.{50}/, "" )
                    .replace( /bctid=.{13}/, "" );
        src_query = src_query.replace( /&t=(?:(\d+)m)?(?:(\d+)s)?/, function( all, minutes, seconds ) {

          // Make sure we have real zeros
          minutes = minutes | 0; // bit-wise OR
          seconds = seconds | 0; // bit-wise OR

          fragmentStart = ( +seconds + ( minutes * 60 ) );
          return "";
        });
        src_query = src_query.replace( /&start=(\d+)?/, function( all, seconds ) {

          // Make sure we have real zeros
          seconds = seconds | 0; // bit-wise OR

          fragmentStart = seconds;
          return "";
        });

        autoPlay = ( /autoplay=1/.test( src_query ) );
        
        // Build url for brightcove player
        params = {
          height: options.height || "100%",
          width: options.width || "100%",
          flashID: container['data-object'],
          bgcolor: options.bgcolor || "#ffffff",
          playerID: bcpid,
          playerKey: bckey,
          isVid: "true",
          isUI: "true",
          dynamicStreaming: options.dynamicStreaming || "true",
          '@videoPlayer': bctid,
          templateLoadHandler: "onBrightcovePlayerAPIReady",
          templateErrorHandler: "onBrightcovePlayerAPIError",
          autoStart: options.autoplay ? "true" : "false"
        };

        for(var p in params)
           query.push(encodeURIComponent(p) + "=" + encodeURIComponent(params[p]));
        query = query.join("&");
        src = 'http://c.brightcove.com/services/viewer/federated_f9?' + query;
        
        // Player parameters
        playerVars = {
          allowScriptAccess: "always",
          allowFullScreen: "true",
          seamlessTabbing: "false",
          swliveconnect: "true",
          wmode: options.wmode || "transparent", 
          quality: options.quality || "high",
          bgcolor: options.bgcolor || "#ffffff"
        };
        
        // Object attributes
        atts = {
          id: container['data-object'],
          'class': 'BrightcoveExperience'
        }
        
        // Append container to media area
        options._container = container;
        media.appendChild( container );
        
        // create swf object
        swfobject.embedSWF( src, container.id, params.width, params.height, 
          flashVersion, expressInstallSwfurl, flashvars, playerVars, atts );
        
      };
      
      var brightcoveError = function(error){
        media.error = {
          customCode: error.code || 100  // 100 = invalid url
        };
        media.dispatchEvent( "error" );
      };

      var brightcoveInit = function() {

        var firstPlay = true, seekEps = 0.1,
            experience = brightcove.getExperience(container['data-object']),
            brightcoveExp;
              
        if ( !experience ) return;        
        options.brightcoveExp = experience.getModule(APIModules.EXPERIENCE);
        options.brightcoveObject = experience.getModule(APIModules.VIDEO_PLAYER);
        
        // custom bitrate
        if ( options.bitRateRange && options.bitRateRange.length==2 ) {
          options.brightcoveObject.setBitRateRange( options.bitRateRange[0], options.bitRateRange[1] );
        }
        
        // custom buffer capacity
        if ( options.bufferCapacity && options.bufferCapacity > 0 ) {
          options.brightcoveObject.setBackBufferCapacity(options.bufferCapacity);
          options.brightcoveObject.setBufferCapacity(options.bufferCapacity);
        }
        
        // custom buffer time
        if ( options.bufferTime && options.bufferTime > 0 ) {
          options.brightcoveObject.enableInitialBandwidthDetection(false);
          options.brightcoveObject.setDefaultBufferTime(options.bufferTime);
        }
        
        var timeUpdate = function() {

          if ( options.destroyed ) {
            return;
          }
          
          // check buffers for canplay events
          if ( !canPlay ) {
            var bufferCapacity = options.brightcoveObject.getBufferCapacity(),
                bufferLength = options.brightcoveObject.getBufferLength();
            // we could play through if buffer length is half of capacity
            if ( bufferLength >= bufferCapacity/2 ) {
              media.dispatchEvent( "canplay" );
              media.dispatchEvent( "canplaythrough" );
              canPlay = true;
            }
          }

          var bcTime = options.brightcoveObject.getVideoPosition();
          if ( !seeking ) {
            currentTime = bcTime;
          } else if ( currentTime >= bcTime - seekEps && currentTime <= bcTime + seekEps ) {
            seeking = false;
            seekEps = 0.1;
            media.dispatchEvent( "seeked" );
          } else {
            // seek didn't work very well, try again with higher tolerance
            seekEps *= 2;
            options.brightcoveObject.seek( currentTime );
          }       
          
          media.dispatchEvent( "timeupdate" );
          
          setTimeout( timeUpdate, 200 );
        };
        
        var onMediaPlay = function(evt) {
          if ( !firstPlay ) {
            paused = false;
            media.dispatchEvent( "play" );
            media.dispatchEvent( "playing" );
            playerQueue.next();
          }                 
        };
        
        var onBufferBegin = function(evt) {
          if ( firstPlay ) {
            firstPlay = false;
            if ( autoPlay || !media.paused ) {
              paused = false;
            }
            setTimeout( function(){              
              if ( paused ) options.brightcoveObject.pause();                        
            }, 200 );
            timeUpdate();            
          }       
        }
        
        var onMediaStop = function(evt) {
          paused = true;
          media.dispatchEvent( "pause" );
          playerQueue.next();
        };
        
        var onMediaComplete = function(evt) {
          media.dispatchEvent( "ended" );
        };
        
        var onVolumeChange = function(evt) {
          if ( options.destroyed ) {

            return;
          }

          if ( lastMuted !== options.brightcoveObject.isMuted() ) {

            lastMuted = options.brightcoveObject.isMuted();
            media.dispatchEvent( "volumechange" );
          }

          if ( lastVolume !== options.brightcoveObject.getVolume() ) {

            lastVolume = options.brightcoveObject.getVolume();
            media.dispatchEvent( "volumechange" );
          }
        };
        
        var onTemplateReady = function(evt){
          
          // retrieve duration
          media.duration = options.brightcoveObject.getVideoDuration();       
          media.dispatchEvent( "durationchange" );
          media.dispatchEvent( "loadedmetadata" );
          media.readyState = 4;
          
          // pulling initial volume states form baseplayer
          lastVolume = media.volume;
          lastMuted = media.muted;
  
          paused = media.paused;
          
          createProperties();          
          
          options.brightcoveObject.play();
  
          media.currentTime = fragmentStart;
  
          media.dispatchEvent( "loadstart" );
          media.dispatchEvent( "loadeddata" );
            
        };
        
        /* add event listeners */
        options.brightcoveObject.addEventListener(BCMediaEvent.PLAY, onMediaPlay);
        options.brightcoveObject.addEventListener(BCMediaEvent.BUFFER_BEGIN, onBufferBegin);           
        options.brightcoveObject.addEventListener(BCMediaEvent.STOP, onMediaStop);
        options.brightcoveObject.addEventListener(BCMediaEvent.COMPLETE, onMediaComplete);
        options.brightcoveObject.addEventListener(BCMediaEvent.VOLUME_CHANGE, onVolumeChange);
        options.brightcoveObject.addEventListener(BCMediaEvent.ERROR, brightcoveError);
        
        options.brightcoveExp.addEventListener(BCExperienceEvent.TEMPLATE_READY, onTemplateReady);

      };
      
      // load the Brightcove API script if it doesn't exist
      function loadScript() {
        if ( !window.brightcove && !loading ) {
          loading = true;
          Popcorn.getScript( "http://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js", function(){
            Popcorn.getScript( "http://admin.brightcove.com/js/BrightcoveExperiences.js", function(){
              Popcorn.getScript( "http://admin.brightcove.com/js/APIModules_all.js", function(){
                scriptReady();
              });
            });
          });
        } else {
          (function isReady() {
            setTimeout(function() {
              if ( !scriptLoaded ) {
                isReady();
              } else {
                scriptReady();
              }
            }, 100 );
          })();
        }
      }

      if ( !scriptLoaded ) {
        loadScript();
      } else {
        scriptReady();
      }
      

    },
    _teardown: function( options ) {

      options.destroyed = true;

      var brightcoveObject = options.brightcoveObject,
          brightcoveExp = options.brightcoveExp;

      if( brightcoveObject ){
        brightcoveObject.stop();
      }
      if ( brightcoveExp ) {
        brightcoveExp.unload();
      }
      
      if ( document.getElementById( options._container.id ) )
        this.removeChild( document.getElementById( options._container.id ) );

      if ( document.getElementById( 'object'+options._container.id ) )
        this.removeChild( document.getElementById( 'object'+options._container.id ) );

    }
  });
}( window, Popcorn ));
