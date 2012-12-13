test( "BC Script not loaded", 1, function() {
  ok( !window.brightcove, "Player doesn't load brightcove before first setup call" );
});

asyncTest( "autoplay on", 1, function() {

  var p = Popcorn.brightcove( "#video", "http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001&autoplay=1" );

  p.on( "canplaythrough", function() {
    equal( p.media.paused, false, "autoplay on is recognized on URL" );
    p.pause();
    p.destroy();
    start();
  });

});

asyncTest( "autoplay off", 1, function() {

  var p = Popcorn.brightcove( "#video", "http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001&autoplay=0" );

  p.on( "canplaythrough", function() {
    equal( p.media.paused, true, "autoplay off is recognized on URL" );
    p.pause();
    p.destroy();
    start();
  });

});

asyncTest( "paused is false when playing", 1, function() {

  var p = Popcorn.brightcove( "#video", "http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001" );

  p.on( "canplaythrough", function() {
    p.play();
    equal( p.media.paused, false, "paused is false when playing" );
    p.pause();
    p.destroy();
    start();
  });

});

asyncTest( "paused is true during canplaythrough", 1, function() {

  var p = Popcorn.brightcove( "#video", "http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001" );

  p.on( "canplaythrough", function() {
    equal( p.media.paused, true, "paused is true in canplaythrough" );
    p.destroy();
    start();
  });

});

asyncTest("Update Timer", function () {

  var p2 = Popcorn.brightcove( '#video2', 'http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001' ),
      expects = 12,
      count   = 0,
      execCount = 0,
      // These make sure events are only fired once
      // any second call will produce a failed test
      forwardStart  = false,
      forwardEnd    = false,
      backwardStart = false,
      backwardEnd   = false,
      wrapperRunning = { one: false, two: false };

  function plus() {
    if ( ++count === expects ) {
      // clean up added events after tests
      Popcorn.removePlugin( "forwards" );
      Popcorn.removePlugin( "backwards" );
      Popcorn.removePlugin( "wrapper" );
      p2.removePlugin( "cue" );
      p2.destroy();
      start();
    }
  }

  Popcorn.plugin( "forwards", function () {
    return {
      start: function ( event, options ) {

        if ( !options.startFired ) {

          options.startFired = true;
          forwardStart = !forwardStart;
          ok( forwardStart, "forward's start fired" );
          plus();
        }
      },
      end: function ( event, options ) {

        if ( !options.endFired ) {

          options.endFired = true;
          forwardEnd = !forwardEnd;
          p2.currentTime(1).play();
          ok( forwardEnd, "forward's end fired" );
          plus();
        }
      }
    };
  });

  p2.forwards({
    start: 3,
    end: 4
  });

  Popcorn.plugin( "backwards", function () {
    return {
      start: function ( event, options ) {

        if ( !options.startFired ) {

          options.startFired = true;
          backwardStart = !backwardStart;
          ok( true, "backward's start fired" );
          plus();
        }
      },
      end: function ( event, options ) {

        if ( !options.endFired ) {

          options.endFired = true;
          backwardEnd = !backwardEnd;
          ok( backwardEnd, "backward's end fired" );
          plus();
          p2.currentTime( 0 ).play();
        }
      }
    };
  });

  p2.backwards({
    start: 1,
    end: 2
  });

  Popcorn.plugin( "wrapper", {
    start: function ( event, options ) {

      wrapperRunning[ options.wrapper ] = true;
    },
    end: function ( event, options ) {

      wrapperRunning[ options.wrapper ] = false;
    }
  });

  // second instance of wrapper is wrapping the first
  p2.wrapper({
    start: 6,
    end: 7,
    wrapper: "one"
  })
  .wrapper({
    start: 5,
    end: 8,
    wrapper: "two"
  })
  // checking wrapper 2's start
  .cue( 5, function() {

    if ( execCount === 0 ) {

      execCount++;
      ok( wrapperRunning.two, "wrapper two is running at second 5" );
      plus();
      ok( !wrapperRunning.one, "wrapper one is stopped at second 5" );
      plus();
    }
  })
  // checking wrapper 1's start
  .cue( 6, function() {

    if ( execCount === 1 ) {

      execCount++;
      ok( wrapperRunning.two, "wrapper two is running at second 6" );
      plus();
      ok( wrapperRunning.one, "wrapper one is running at second 6" );
      plus();
    }
  })
  // checking wrapper 1's end
  .cue( 7, function() {

    if ( execCount === 2 ) {

      execCount++;
      ok( wrapperRunning.two, "wrapper two is running at second 7" );
      plus();
      ok( !wrapperRunning.one, "wrapper one is stopped at second 7" );
      plus();
    }
  })
  // checking wrapper 2's end
  .cue( 8, function() {

    if ( execCount === 3 ) {

      execCount++;
      ok( !wrapperRunning.two, "wrapper two is stopped at second 9" );
      plus();
      ok( !wrapperRunning.one, "wrapper one is stopped at second 9" );
      plus();
    }
  });

  p2.cue( 3, function() {
    p2.play();
  });

  var ready = function() {
    p2.off( "canplaythrough", ready );

    p2.volume( 0 ).currentTime( 3 );
  };

  if ( p2.readyState() >= 4 ) {
    ready();
  } else {
    p2.on( "canplaythrough", ready );
  }
});

asyncTest("Plugin Factory", function () {

  var popped = Popcorn.brightcove( '#video2', 'http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001' ),
      methods = "load play pause currentTime mute volume roundTime exec removePlugin",
      expects = 34, // 15*2+2+2. executor/complicator each do 15
      count = 0;

  function plus() {

    if ( ++count == expects ) {
      Popcorn.removePlugin("executor");
      Popcorn.removePlugin("complicator");
      popped.destroy();
      start();
    }
  }

  expect( expects );

  Popcorn.plugin("executor", function () {

    return {

      start: function () {
        var self = this;

        // These ensure that a popcorn instance is the value of `this` inside a plugin definition

        methods.split(/\s+/g).forEach(function (k,v) {
          ok( k in self, "executor instance has method: " + k );

          plus();
        });

        ok( "media" in this, "executor instance has `media` property" );
        plus();
        ok( typeof popped.media === "object", "video property is a HTML DIV element" );
        plus();

        ok( "data" in this, "executor instance has `data` property" );
        plus();
        ok( typeof popped.data === "object", "data property is an object" );
        plus();

        ok( "trackEvents" in this.data, "executor instance has `trackEvents` property" );
        plus();
        ok( typeof popped.data.trackEvents === "object", "executor trackEvents property is an object" );
        plus();
      },
      end: function () {

      }
    };

  });

  ok( "executor" in popped, "executor plugin is now available to instance" );
  plus();
  equal( Popcorn.registry.length, 1, "One item in the registry");
  plus();

  popped.executor({
    start: 1,
    end: 2
  });

  Popcorn.plugin("complicator", {

    start: function ( event ) {

      var self = this;

      // These ensure that a popcorn instance is the value of `this` inside a plugin definition

      methods.split(/\s+/g).forEach(function (k,v) {
        ok( k in self, "complicator instance has method: " + k );

        plus();
      });

      ok( "media" in this, "complicator instance has `media` property" );
      plus();
      ok( typeof popped.media === "object", "video property is a HTMLVideoElement" );
      plus();

      ok( "data" in this, "complicator instance has `data` property" );
      plus();
      ok( typeof popped.data === "object", "complicator data property is an object" );
      plus();

      ok( "trackEvents" in this.data, " complicatorinstance has `trackEvents` property" );
      plus();
      ok( typeof popped.data.trackEvents === "object", "complicator trackEvents property is an object" );
      plus();
    },
    end: function () {

      //start();

    },
    timeupdate: function () {
    }
  });

  ok( "complicator" in popped, "complicator plugin is now available to instance" );
  plus();
  equal( Popcorn.registry.length, 2, "Two items in the registry");
  plus();

  popped.complicator({
    start: 4,
    end: 5
  });

  popped.volume( 0 ).currentTime( 0 ).play();


});

asyncTest( "Popcorn Brightcove Plugin Url and Duration Tests", function() {

  var count = 0,
      expects = 3,
      popcorn = Popcorn.brightcove( '#video2', 'http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001' );

  function plus(){

    if ( ++count == expects ) {
      popcorn.destroy();
      start();
    }
  }

  expect( expects );

  popcorn.on( "canplaythrough", function() {
    equal( popcorn.media.id, 'video2', 'Video id set' );
    plus();
  });

  popcorn.on( "durationchange", function() {

    notEqual( popcorn.duration(), 0, "Duration has been changed from 0" );
    plus();

    popcorn.pause();
  });

  equal( popcorn.media.id, 'video2', 'Video id set' );
  plus();

  popcorn.volume( 0 ).play();
});

asyncTest( "Popcorn Brightcove Plugin Url Regex Test", function() {

  var urlTests = [
    { name: 'standard',
      url: 'http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001',
      expected: 'http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001'
    }
  ];

  var count = 0,
      i = 11,
      expects = urlTests.length;

  expect( expects );

  Popcorn.forEach( urlTests, function( value, key ) {

    var urlTest = urlTests[ key ],
        popcorn = Popcorn.brightcove( "#video" + i++, urlTest.url );

    popcorn.on( "loadeddata", function() {

      equal( popcorn.media.src, urlTest.expected, "Video id is correct for " + urlTest.name + ": " + urlTest.url );
      popcorn.pause();

      popcorn.destroy();

      if ( ++count === expects ) {

        start();
      }
    }).volume( 0 );
  });
});

asyncTest( "Player height and width", function() {

  expect( 2 );

  var popcorn = Popcorn.brightcove( "#video4", "http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001" );
  var readyStatePoll = function() {

    if ( popcorn.media.readyState !== 4 ) {

      setTimeout( readyStatePoll, 10 );
    } else {

      equal( popcorn.media.children[ 0 ].width, "100%",
        "Brightcove player width is 100%" );
      equal( popcorn.media.children[ 0 ].height, "100%",
        "Brightcove player height is 100%" );
      popcorn.destroy();
      start();
    }
  };

  popcorn.volume( 0 );

  readyStatePoll();
});

asyncTest( "Player Errors", function() {

  expect( 2 );

  var pop = Popcorn.brightcove( "#video4", "http://link.brightcove.com/services/player/bcpid1234567890abc?bckey=abcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxy&bctid=1234567890abc", {
    events: {
      error: function() {

        ok( true, "error trigger by invalid URL" );
        equal( pop.error.customCode, 100, "error.customCode is 100 for invalid URL" );
        pop.destroy();
        start();
      }
    }
   });
});

asyncTest( "Brightcove ended event", function() {

  expect( 1 );

  var pop = Popcorn.brightcove( "#video10", "http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001" );

  pop.on( "ended", function() {
    ok( true, "Brightcove is successfully firing the ended event" );
    start();
  });

  pop.cue( 5, function(){
    pop.currentTime( 150 );
  });

  pop.play();
});

asyncTest( "brightcove player gets a proper _teardown", function() {

  var count = 0,
      expects = 1;

  function plus() {
    if ( ++count === expects ) {

      start();
    }
  }

  expect( expects );

  var popcorn = Popcorn.brightcove( "#video9", "http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001" );
  popcorn.on( "loadeddata", function() {

    popcorn.destroy();
    equal( popcorn.media.children.length, 0, "" );
    plus();
  });
});

asyncTest( "Brightcove ready state events", function() {

  var popped,
      expects = 4,
      count = 0,
      state = 0;

  expect( expects );

  function plus() {
    if ( ++count === expects ) {

      start();
    }
  }

  expect( expects );

  var popcorn = Popcorn.brightcove( "#video9", "http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001" );
  popcorn.on( "loadeddata", function() {

    popcorn.destroy();
    equal( popcorn.media.children.length, 0, "" );
    plus();
  });

  popped = Popcorn.brightcove( "#video6", "http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001", {
    events: {
      canplaythrough: function( e ) {

        equal( state++, 2, "canplaythrough fired first" );
        plus();
      },
      loadedmetadata: function( e ) {

        equal( state++, 0, "loadedmetadata fired third" );
        plus();
      },
      loadeddata: function( e ) {

        equal( state++, 1, "loadeddata fired last" );
        plus();
      }
    }
  });

});

asyncTest( "Brightcove media start time fragment", function() {

  var popcorn1, popcorn2, popcorn3, popcorn4,
      count = 0, expects = 4,
      // Brightcove's fragment can be off by give or take a second.
      epsilon = 1;

  expect( expects );

  function plus() {
    if ( ++count === expects ) {

      popcorn1.destroy();
      popcorn2.destroy();
      popcorn3.destroy();
      popcorn4.destroy();
      start();
    }
  }

  var firstTest = function() {

        popcorn1.off( "loadeddata", firstTest );
        ok( Math.ceil( popcorn1.currentTime() ) + epsilon >= 130, "brightcove fragment works with &start=130" );
        plus();
      },
      secondTest = function() {

        popcorn2.off( "loadeddata", secondTest );
        ok( Math.ceil( popcorn2.currentTime() ) + epsilon >= 130, "brightcove fragment works with &t=2m10s" );
        plus();
      },
      thirdTest = function() {

        popcorn3.off( "loadeddata", thirdTest );
        ok( Math.ceil( popcorn3.currentTime() ) + epsilon >= 120, "brightcove fragment works with &t=2m" );
        plus();
      },
      fourthTest = function() {

        popcorn4.off( "loadeddata", fourthTest );
        ok( Math.ceil( popcorn4.currentTime() )+ epsilon >= 10, "brightcove fragment works with &t=10s" );
        plus();
      };

  popcorn1 = Popcorn.brightcove( "#video8", "http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001&start=130" );
  popcorn1.on( "loadeddata", firstTest);
  if ( popcorn1.readyState >= 4 ) {

    firstTest();
  }

  popcorn2 = Popcorn.brightcove( "#video9", "http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001&t=2m10s" );
  popcorn2.on( "loadeddata", secondTest);
  if ( popcorn2.readyState >= 4 ) {

    secondTest();
  }

  popcorn3 = Popcorn.brightcove( "#video10", "http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001&t=2m" );
  popcorn3.on( "loadeddata", thirdTest);
  if ( popcorn3.readyState >= 4 ) {

    thirdTest();
  }

  popcorn4 = Popcorn.brightcove( "#video11", "http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001&t=10s" );
  popcorn4.on( "loadeddata", fourthTest);
  if ( popcorn4.readyState >= 4 ) {

    fourthTest();
  }
});

asyncTest( "brightcove player quarantine", function() {

  ok( window.quarantineBC, "quarantine of broken brightcove player exists." );
  start();
});

asyncTest( "brightcove can play type", function() {
  ok( Popcorn.brightcove.canPlayType( "div", "link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001" ), "brightcove can play url in this format: link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001" );
  ok( !Popcorn.brightcove.canPlayType( "div", [ "http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001", "link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001" ] ), "Brightcove can't play an array of urls" );
  start();
});
