popcorn-js-brightcove-player
=============
A Brightcove Player for Mozilla's HTML5 Video Framework: [http://popcornjs.org](http://popcornjs.org)

##Overview

Players allow Popcorn to be used with various other types of media other than HTML5 video and audio. Popcorn currently supports YouTube, Vimeo, and SoundCloud. This player allows for use with Brightcove video and audio files.

##Setup

Include the players/brightcove/popcorn.brightcove.js file right after you include your popcorn.js file as follows:

```html
<script type="text/javascript" src="path/to/popcorn.js"></script>
<script type="text/javascript" src="path/to/popcorn.brightcove.js"></script>
```

##Usage

Use the player as you would other [Popcorn media players](http://popcornjs.org/popcorn-docs/players/).

###Options

- **id [String]** - the id of the HTML element that the appropriate player will populate
- **url [String]** - the url of the media you wish to use

###URL Format

The URL must be the full brightcove media url (it cannot be shortened).

You can find this URL by going to your Brightcove Media dashboard, clicking on a video, then clicking ***Quick Video Publish*** -> ***URL***, then copying the shortened URL (e.g. *http://bcove.me/abcdefgh*) and pasting it in a browser to resolve to the full URL.

If you would like to build this URL programmatically, it will be in the format http://link.brightcove.com/services/player/bcpid***{PLAYER_ID}***?bckey=***{PLAYER_KEY}***&bctid=***{VIDEO_ID}***

***VIDEO_ID*** is the Brightcove Video ID. ***PLAYER_ID*** and ***PLAYER_KEY*** can be found by going to your Brightcove Publishing dashboard, clicking the appropriate player, then clicking ***Get Code***, then scroll to the lines that are in this format:

```html
<param name="playerID" value="1592571451001" />
<param name="playerKey" value="AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF" />
```

Also, make sure that you have [Enable Actionscript/Javascript APIs](http://support.brightcove.com/en/video-cloud/docs/getting-started-smart-player-api#enable) checked in your Player settings.

###Examples

Using the Smart Player:

```javascript
var pop = Popcorn.smart( '#video', 'http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001' );

pop.footnote({
  start: 1,
  end: 5,
  text: "Works with brightcove!",
  target: "footnote-div"
});

pop.play();
```

Using the Brightcove Player:

```javascript
var pop = Popcorn.brightcove( '#video', 'http://link.brightcove.com/services/player/bcpid1592571451001?bckey=AQ~~,AAABchwNFVk~,kE6q8YogD3vpn3QfnsIdak7n1kINhcVF&bctid=1864890674001' );

pop.footnote({
  start: 1,
  end: 5,
  text: "Works with brightcove!",
  target: "footnote-div"
});

pop.play();
```
