/*********************************************************************
This file contains support javascript functions used by a browser.
They are easier to write here in javascript, then in C using the js api.
And it is portable amongst all js engines.
This file is converted into a C string and compiled and run
at the start of each javascript window.
Please take advantage of this machinery and put functions here,
including prototypes and getter / setter support functions,
whenever it makes sense to do so.

edbrowse support functions and native methods will always start with eb$,
hoping they will not accidentally collide with js functions in the wild.
Example: eb$newLocation, a native method that redirects this web page to another.

It would be nice to run this file stand-alone, outside of edbrowse,
even if the functionality is limited.
To this end, I create the window object if it isn't already there,
using some clever code I found on the internet.
*********************************************************************/

if(typeof window === "undefined") {
window = (function() { return this; })();
eb$master = {compiled: false};
document = new Object;
// Stubs for native methods that are normally provided by edbrowse.
// Example: eb$puts, which we can replace with print,
// which is native to the duktape shell.
eb$puts = print;
eb$logputs = function(a,b) { print(b); }
eb$newLocation = function (s) { print("new location " + s); }
eb$logElement = function(o, tag) { print("pass tag " + tag + " to edbrowse"); }
eb$getcook = function(member) { return "cookies"; }
eb$setcook = function(value, member) { print(" new cookie " + value); }
eb$formSubmit = function() { print("submit"); }
eb$formReset = function() { print("reset"); }
document.eb$apch2 = function(c) { alert("append " + c.nodeName  + " to " + this.nodeName); this.childNodes.push(c); }
document.nodeName = "document";
document.head = {};
document.head.childNodes = [];
document.body = {};
document.body.childNodes = [];
}

// other names for window
self = top = parent = window;
// parent and top could be changed if this is a frame in a larger frameset.

/* An ok (object keys) function for javascript/dom debugging.
 * This is in concert with the jdb command in edbrowse.
 * I know, it doesn't start with eb$ but I wanted an easy,
 * mnemonic command that I could type in quickly.
 * If a web page creates an ok function it will override this one. */
ok = Object.keys = Object.keys || (function () { 
		var hasOwnProperty = Object.prototype.hasOwnProperty, 
		hasDontEnumBug = !{toString:null}.propertyIsEnumerable("toString"),
		DontEnums = [ 
		'toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 
		'isPrototypeOf', 'propertyIsEnumerable', 'constructor' 
		], 
		DontEnumsLength = DontEnums.length; 
		return function (o) { 
		if (typeof o != "object" && typeof o != "function" || o === null) 
		throw new TypeError("Object.keys called on a non-object");
		var result = []; 
		for (var name in o) { 
		if (hasOwnProperty.call(o, name)) 
		result.push(name); 
		} 
		if (hasDontEnumBug) { 
		for (var i = 0; i < DontEnumsLength; i++) { 
		if (hasOwnProperty.call(o, DontEnums[i]))
		result.push(DontEnums[i]);
		}
		}
		return result; 
		}; 
		})(); 

// Dump the tree below a node, this is for debugging.
document.nodeName = "document"; // in case you want to start at the top.
// Print the first line of text for a text node, and no braces
// because nothing should be below a text node.
// You can make this more elaborate and informative if you wish.
if(!eb$master.compiled) {

eb$master.dumptree = function(top) {
var nn = top.nodeName.toLowerCase();
var extra = "";
if(nn === "text" && top.data) {
extra = top.data;
extra = extra.replace(/^[ \t\n]*/, "");
var l = extra.indexOf('\n');
if(l >= 0) extra = extra.substr(0,l);
}
if(nn === "option" && top.text)
extra = top.text;
if(nn === "a" && top.href)
extra = top.href.toString();
if(nn === "base" && top.href)
extra = top.href.toString();
if(extra.length) extra = ' ' + extra;
// some tags should never have anything below them so skip the parentheses notation for these.
if((nn == "base" || nn == "meta" || nn == "link" ||nn == "text" || nn == "image" || nn == "option") && top.childNodes.length == 0) {
alert(nn + extra);
return;
}
alert(nn + " {" + extra);
if(top.childNodes) {
for(var i=0; i<top.childNodes.length; ++i) {
var c = top.childNodes[i];
dumptree(c);
}
}
alert("}");
}

/*********************************************************************
Show the scripts, where they come from, type, length, whether deminimized.
Careful! This is compiled once.
If you refer to document.scripts you are stuck with that set of scripts forever.
Use this.document.scripts for the scripts in the current window.
*********************************************************************/

eb$master.showscripts = function()
{
var i, s, m;
var slist = this.document.scripts;
for(i=0; i<slist.length; ++i) {
s = slist[i];
m = i + ": ";
if(s.type) m += s.type;
else m += "default";
m += " ";
if(s.src) {
var ss = s.src.toString();
if(ss.match(/^data:/)) ss = "data";
m += ss;
} else {
m += "inline";
}
m += " length " + s.data.length;
if(s.expanded) m += " deminimized";
alert(m);
}
}

}

dumptree = eb$master.dumptree;
showscripts = eb$master.showscripts;

// This is our bailout function, it references a variable that does not exist.
function eb$stopexec() { return javascript$interrupt; }

eb$nullfunction = function() { return null; }
eb$voidfunction = function() { }
eb$truefunction = function() { return true; }
eb$falsefunction = function() { return false; }

focus = blur = scroll = eb$voidfunction;
document.focus = document.blur = document.open = document.close = eb$voidfunction;

/* Some visual attributes of the window.
 * These are just guesses.
 * Better to have something than nothing at all. */
height = 768;
width = 1024;
// document.status is removed because it creates a conflict with
// the status property of the XMLHttpRequest implementation
defaultStatus = 0;
returnValue = true;
menubar = true;
scrollbars = true;
toolbar = true;
resizable = true;
directories = false;
name = "unspecifiedFrame";

document.bgcolor = "white";
document.readyState = "loading";
document.nodeType = 9;

// Can't put implementation object into master
// until createElement and all of our classes are in master.
document.implementation = {
/*********************************************************************
This is my tentative implementation of hasFeature:
hasFeature: function(mod, v) {
// tidy claims html5 so we'll run with that
var supported = { "html": "5", "Core": "?", "XML": "?"};
if(!supported[mod]) return false;
if(v == undefined) return true; // no version specified
return (v <= supported[mod]);
},
But this page says we're moving to a world where this function is always true,
https://developer.mozilla.org/en-US/docs/Web/API/Document/implementation
so I don't know what the point is.
*********************************************************************/
hasFeature: eb$truefunction,
createDocumentType: function(tag, pubid, sysid) {
// I really don't know what this function is suppose to do.
var tagstrip = tag.replace(/:.*/, "");
return document.createElement(tagstrip);
},
// https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createHTMLDocument
createHTMLDocument: function(t) {
if(t == undefined) t = "Empty"; // the title
// put it in a paragraph, just cause we have to put it somewhere.
var p = document.createElement("p");
p.innerHTML = "<iframe></iframe>";
var d = p.firstChild; // this is the created document
// This reference will expand the document via the setter.
d.contentDocument.title = t;
return d.contentDocument;
}
};

screen = new Object;
screen.height = 768;
screen.width = 1024;
screen.availHeight = 768;
screen.availWidth = 1024;
screen.availTop = 0;
screen.availLeft = 0;

// window.alert is a simple wrapper around native puts.
function alert(s) { eb$puts(s); }

// The web console, one argument, print based on debugLevel.
// First a helper function, then the console object.
if(!eb$master.compiled) {
eb$master.eb$logtime = function(debug, level, obj) {
var today=new Date();
var h=today.getHours();
var m=today.getMinutes();
var s=today.getSeconds();
// add a zero in front of numbers<10
if(h < 10) h = "0" + h;
if(m < 10) m = "0" + m;
if(s < 10) s = "0" + s;
eb$logputs(debug, "console " + level + " [" + h + ":" + m + ":" + s + "] " + obj);
}

eb$master.console = {
log: function(obj) { eb$logtime(3, "log", obj); },
info: function(obj) { eb$logtime(3, "info", obj); },
warn: function(obj) { eb$logtime(3, "warn", obj); },
error: function(obj) { eb$logtime(3, "error", obj); }
};
}
eb$logtime = eb$master.eb$logtime;
console = eb$master.console;

Object.defineProperty(document, "cookie", {
get: eb$getcook, set: eb$setcook});

navigator = new Object;
navigator.appName = "edbrowse";
navigator["appCode Name"] = "edbrowse C/duktape";
/* not sure what product is about */
navigator.product = "duktape";
navigator.productSub = "2.1";
navigator.vendor = "Karl Dahlke";
navigator.javaEnabled = eb$falsefunction;
navigator.taintEnabled = eb$falsefunction;
navigator.cookieEnabled = true;
navigator.onLine = true;
navigator.mimeTypes = [];
navigator.plugins = [];
// the rest of navigator, and of course the plugins,
// must be filled in at run time based on the config file.
// This line lets us run querySelectorAll in stand alone mode,
// it is overwritten at startup by edbrowse.
navigator.userAgent = "edbrowse/3.0.0";

/* There's no history in edbrowse. */
/* Only the current file is known, hence length is 1. */
history = new Object;
history.length = 1;
history.next = "";
history.previous = "";
history.back = eb$voidfunction;
history.forward = eb$voidfunction;
history.go = eb$voidfunction;
history.toString = function() {
 return "Sorry, edbrowse does not maintain a browsing history.";
} 

/* some base arrays - lists of things we'll probably need */
document.heads = new Array;
document.bases = new Array;
document.links = new Array;
document.metas = new Array;
document.styles = new Array;
document.bodies = new Array;
document.forms = new Array;
document.elements = new Array;
document.anchors = new Array;
document.divs = new Array;
document.htmlobjs = new Array;
document.scripts = new Array;
document.paragraphs = new Array;
document.tables = new Array;
document.spans = new Array;
document.images = new Array;
document.areas = new Array;
frames = new Array;

// implementation of getElementsByTagName, getElementsByName, and getElementsByClassName.
// These are recursive as they descend through the tree of nodes.

if(!eb$master.compiled) {
eb$master.getElementsByTagName = function(s) { 
s = s.toLowerCase();
return eb$master.eb$gebtn(this, s);
}
eb$master.eb$gebtn = function(top, s) { 
var a = new Array;
if(s === '*' || (top.nodeName && top.nodeName.toLowerCase() === s))
a.push(top);
if(top.childNodes) {
for(var i=0; i<top.childNodes.length; ++i) {
var c = top.childNodes[i];
a = a.concat(eb$master.eb$gebtn(c, s));
}
}
return a;
}

eb$master.getElementsByName = function(s) { 
s = s.toLowerCase();
return eb$master.eb$gebn(this, s);
}
eb$master.eb$gebn = function(top, s) { 
var a = new Array;
if(s === '*' || (top.name && top.name.toLowerCase() === s))
a.push(top);
if(top.childNodes) {
for(var i=0; i<top.childNodes.length; ++i) {
var c = top.childNodes[i];
a = a.concat(eb$master.eb$gebn(c, s));
}
}
return a;
}

eb$master.getElementsByClassName = function(s) { 
s = s.toLowerCase();
return eb$master.eb$gebcn(this, s);
}
eb$master.eb$gebcn = function(top, s) { 
var a = new Array;
if(s === '*' || (top.className && top.className.toLowerCase() === s))
a.push(top);
if(top.childNodes) {
for(var i=0; i<top.childNodes.length; ++i) {
var c = top.childNodes[i];
a = a.concat(eb$master.eb$gebcn(c, s));
}
}
return a;
}
} // master compile

document.getElementsByTagName = eb$master.getElementsByTagName;
document.getElementsByClassName = eb$master.getElementsByClassName;
document.getElementsByName = eb$master.getElementsByName;

document.idMaster = new Object;
document.getElementById = function(s) { 
return document.idMaster[s]; 
}

// originally ms extension pre-DOM, we don't fully support it
//but offer the legacy document.all.tags method.
document.all = new Object;
document.all.tags = function(s) { 
return eb$master.eb$gebtn(document.body, s.toLowerCase());
}

/*********************************************************************
Set and clear attributes. This is done in 3 different ways,
the third using attributes as an array.
This may be overkill - I don't know.
*********************************************************************/

if(!eb$master.compiled) {
eb$master.getAttribute = function(name) { return this[name.toLowerCase()]; }
eb$master.hasAttribute = function(name) { if (this[name.toLowerCase()]) return true; else return false; }
eb$master.setAttribute = function(name, v) { 
var n = name.toLowerCase();
this[n] = v; 
this.attributes[n] = v;
this.attributes.push(n);
}
eb$master.removeAttribute = function(name) {
    var n = name.toLowerCase();
    if (this[n]) delete this[n];
if(this.attributes[n]) delete this.attributes[n];
    for (var i=this.attributes.length - 1; i >= 0; --i) {
        if (this.attributes[i] == n) {
this.attributes.splice(i, 1);
break;
}
}
}
} // master compile
document.getAttribute = eb$master.getAttribute;
document.setAttribute = eb$master.setAttribute;
document.hasAttribute = eb$master.hasAttribute;
document.removeAttribute = eb$master.removeAttribute;

/*********************************************************************
Here comes a bunch of stuff regarding the childNodes array,
holding the children under a given html node.
The functions eb$apch1 and eb$apch2 are native. They perform appendChild in js.
The first has no side effects, because the linkage was already performed
within edbrowse via html, and a linkage side effect would only confuse things.
The second, eb$apch2, has side effects, as js code calls appendChild
and those links have to pass back to edbrowse.
But, the wrapper function appendChild makes another check;
if the child is already linked into the tree, then we have to unlink it first,
before we put it somewhere else.
This is a call to removeChild, which unlinks in js,
and passses the remove side effect back to edbrowse.
The same reasoning holds for insertBefore.
*********************************************************************/

if(!eb$master.compiled) {
eb$master.appendChild = function(c) {
if(c.parentNode) c.parentNode.removeChild(c);
return this.eb$apch2(c);
}

eb$master.insertBefore = function(c, t) {
if(c.parentNode) c.parentNode.removeChild(c);
return this.eb$insbf(c, t);
}

eb$master.eb$getSibling = function (obj,direction)
{
if (typeof obj.parentNode == 'undefined') {
// need calling node to have parent and it doesn't, error
return null;
}
var pn = obj.parentNode;
var j, l;
l = pn.childNodes.length;
for (j=0; j<l; ++j)
if (pn.childNodes[j] == obj) break;
if (j == l) {
// child not found under parent, error
return null;
}
switch(direction) {
case "previous":
return (j > 0 ? pn.childNodes[j-1] : null);
break;
case "next":
return (j < l-1 ? pn.childNodes[j+1] : null);
break;
default:
// the function should always have been called with either 'previous' or 'next' specified
return null;
}
}
} // master compile
document.appendChild = eb$master.appendChild;
document.insertBefore = eb$master.insertBefore;

document.childNodes = new Array;
// We'll make another childNodes array belowe every node in the tree.

document.hasChildNodes = function() { return (this.childNodes.length > 0); }
Object.defineProperty(document, "firstChild", {
get: function() { return document.childNodes[0]; }
});
Object.defineProperty(document, "lastChild", {
get: function() { return document.childNodes[document.childNodes.length-1]; }
});
Object.defineProperty(document, "nextSibling", {
get: function() { return eb$master.eb$getSibling(this,"next"); }
});
Object.defineProperty(document, "previousSibling", {
get: function() { return eb$master.eb$getSibling(this,"previous"); }
});
if(!eb$master.compiled) {
eb$master.replaceChild = function(newc, oldc) {
var lastentry;
var l = this.childNodes.length;
var nextinline;
for(var i=0; i<l; ++i) {
if(this.childNodes[i] != oldc)
continue;
if(i == l-1)
lastentry = true;
else {
lastentry = false;
nextinline = this.childNodes[i+1];
}
this.removeChild(oldc);
if(lastentry)
this.appendChild(newc);
else
this.insertBefore(newc, nextinline);
break;
}
}
} // master compile
document.replaceChild = eb$master.replaceChild;

// The first DOM class is the easiest: textNode.
// No weird native methods or side effects.
TextNode = function() {
this.data = "";
if(arguments.length > 0) {
// do your best to turn the arg into a string.
this.data += arguments[0];
}
this.nodeName = "text";
this.tagName = "text";
this.nodeValue = this.data;
this.nodeType=3;
this.ownerDocument = document;
this.style = new CSSStyleDeclaration;
this.style.element = this;
this.className = new String;
/* A text node chould never have children, and does not need childNodes array,
 * but there is improper html out there <text> <stuff> </text>
 * which has to put stuff under the text node, so against this
 * unlikely occurence, I have to create the array.
 * I have to treat a text node like an html node. */
this.childNodes = [];
this.attributes = new Array;
}

document.createTextNode = function(t) {
if(t == undefined) t = "";
var c = new TextNode(t);
eb$logElement(c, "text");
return c;
}

/*********************************************************************
Next, the URL class, which is head-spinning in its complexity and its side effects.
Almost all of these can be handled in JS,
except for setting window.location or document.location to a new url,
which replaces the web page you are looking at.
This side effect does not take place in the constructor, which establishes the initial url.
*********************************************************************/

URL = function() {
var h = "";
if(arguments.length > 0) h= arguments[0];
this.href = h;
}

/* rebuild the href string from its components.
 * Call this when a component changes.
 * All components are strings, except for port,
 * and all should be defined, even if they are empty. */
URL.prototype.rebuild = function() {
var h = "";
if(this.protocol$val.length) {
// protocol includes the colon
h = this.protocol$val;
var plc = h.toLowerCase();
if(plc != "mailto:" && plc != "telnet:" && plc != "javascript:")
h += "//";
}
if(this.host$val.length) {
h += this.host$val;
} else if(this.hostname$val.length) {
h += this.hostname$val;
if(this.port$val != 0)
h += ":" + this.port$val;
}
if(this.pathname$val.length) {
// pathname should always begin with /, should we check for that?
if(!this.pathname$val.match(/^\//))
h += "/";
h += this.pathname$val;
}
if(this.search$val.length) {
// search should always begin with ?, should we check for that?
h += this.search$val;
}
if(this.hash$val.length) {
// hash should always begin with #, should we check for that?
h += this.hash$val;
}
this.href$val = h;
};

// No idea why we can't just assign the property directly.
// URL.prototype.protocol = { ... };
Object.defineProperty(URL.prototype, "protocol", {
  get: function() {return this.protocol$val; },
  set: function(v) { this.protocol$val = v; this.rebuild(); }
});

Object.defineProperty(URL.prototype, "pathname", {
  get: function() {return this.pathname$val; },
  set: function(v) { this.pathname$val = v; this.rebuild(); }
});

Object.defineProperty(URL.prototype, "search", {
  get: function() {return this.search$val; },
  set: function(v) { this.search$val = v; this.rebuild(); }
});

Object.defineProperty(URL.prototype, "hash", {
  get: function() {return this.hash$val; },
  set: function(v) { this.hash$val = v; this.rebuild(); }
});

Object.defineProperty(URL.prototype, "port", {
  get: function() {return this.port$val; },
  set: function(v) { this.port$val = v;
if(this.hostname$val.length)
this.host$val = this.hostname$val + ":" + v;
this.rebuild(); }
});

Object.defineProperty(URL.prototype, "hostname", {
  get: function() {return this.hostname$val; },
  set: function(v) { this.hostname$val = v;
if(this.port$val)
this.host$val = v + ":" +  this.port$val;
this.rebuild(); }
});

Object.defineProperty(URL.prototype, "host", {
  get: function() {return this.host$val; },
  set: function(v) { this.host$val = v;
if(v.match(/:/)) {
this.hostname$val = v.replace(/:.*/, "");
this.port$val = v.replace(/^.*:/, "");
/* port has to be an integer */
this.port$val = parseInt(this.port$val);
} else {
this.hostname$val = v;
this.port$val = 0;
}
this.rebuild(); }
});

var eb$defport = {
http: 80,
https: 443,
pop3: 110,
pop3s: 995,
imap: 220,
imaps: 993,
smtp: 25,
submission: 587,
smtps: 465,
proxy: 3128,
ftp: 21,
sftp: 22,
scp: 22,
ftps: 990,
tftp: 69,
gopher: 70,
finger: 79,
telnet: 23,
smb: 139
};

/* returns default port as an integer, based on protocol */
function eb$setDefaultPort(p) {
var port = 0;
p = p.toLowerCase().replace(/:/, "");
if(eb$defport.hasOwnProperty(p))
port = parseInt(eb$defport[p]);
return port;
}

Object.defineProperty(URL.prototype, "href", {
  get: function() {return this.href$val; },
  set: function(v) {
var inconstruct = true;
if(this.href$val) inconstruct = false;
this.href$val = v;
// initialize components to empty,
// then fill them in from href if they are present */
this.protocol$val = "";
this.hostname$val = "";
this.port$val = 0;
this.host$val = "";
this.pathname$val = "";
this.search$val = "";
this.hash$val = "";
if(v.match(/^[a-zA-Z]*:/)) {
this.protocol$val = v.replace(/:.*/, "");
this.protocol$val += ":";
v = v.replace(/^[a-zA-z]*:\/*/, "");
}
if(v.match(/[/#?]/)) {
/* contains / ? or # */
this.host$val = v.replace(/[/#?].*/, "");
v = v.replace(/^[^/#?]*/, "");
} else {
/* no / ? or #, the whole thing is the host, www.foo.bar */
this.host$val = v;
v = "";
}
if(this.host$val.match(/:/)) {
this.hostname$val = this.host$val.replace(/:.*/, "");
this.port$val = this.host$val.replace(/^.*:/, "");
/* port has to be an integer */
this.port$val = parseInt(this.port$val);
} else {
this.hostname$val = this.host$val;
// should we be filling in a default port here?
this.port$val = eb$setDefaultPort(this.protocol$val);
}
// perhaps set protocol to http if it looks like a url?
// as in edbrowse foo.bar.com
// Ends in standard tld, or looks like an ip4 address, or starts with www.
if(this.protocol$val == "" &&
(this.hostname$val.match(/\.(com|org|net|info|biz|gov|edu|us|uk|ca|au)$/) ||
this.hostname$val.match(/^\d+\.\d+\.\d+\.\d+$/) ||
this.hostname$val.match(/^www\..*\.[a-zA-Z]{2,}$/))) {
this.protocol$val = "http:";
if(this.port$val == 0)
this.port$val = 80;
}
if(v.match(/[#?]/)) {
this.pathname$val = v.replace(/[#?].*/, "");
v = v.replace(/^[^#?]*/, "");
} else {
this.pathname$val = v;
v = "";
}
if(this.pathname$val == "")
this.pathname$val = "/";
if(v.match(/#/)) {
this.search$val = v.replace(/#.*/, "");
this.hash$val = v.replace(/^[^#]*/, "");
} else {
this.search$val = v;
}
if(!inconstruct && (this == window.location || this == document.location)) {
// replace the web page
eb$newLocation('r' + this.href$val + '\n');
}
}
});

URL.prototype.toString = function() { 
return this.href$val;
}

URL.prototype.indexOf = function(s) { 
return this.toString().indexOf(s);
}

URL.prototype.lastIndexOf = function(s) { 
return this.toString().lastIndexOf(s);
}

URL.prototype.substring = function(from, to) { 
return this.toString().substring(from, to);
}

URL.prototype.substr = function(from, to) {
return this.toString().substr(from, to);
}

URL.prototype.toLowerCase = function() { 
return this.toString().toLowerCase();
}

URL.prototype.toUpperCase = function() { 
return this.toString().toUpperCase();
}

URL.prototype.match = function(s) { 
return this.toString().match(s);
}

URL.prototype.replace = function(s, t) { 
return this.toString().replace(s, t);
}

URL.prototype.split = function(s) {
return this.toString().split(s);
}

// On the first call this setter just creates the url, the location of the
// current web page, But on the next call it has the side effect of replacing
// the web page with the new url.
Object.defineProperty(window, "location", {
get: function() { return window.location$2; },
set: function(h) {
if(typeof window.location$2 === "undefined") {
window.location$2 = new URL(h);
} else {
window.location$2.href = h;
}
}});
Object.defineProperty(document, "location", {
get: function() { return document.location$2; },
set: function(h) {
if(typeof document.location$2 === "undefined") {
document.location$2 = new URL(h);
} else {
document.location$2.href = h;
}
}});

// The Attr class and getAttributeNode().
Attr = function(){ this.isId = this.specified = false; this.owner = null; this.name = ""; }

Object.defineProperty(Attr.prototype, "value", {
get: function() { return this.owner.getAttribute(this.name); },
set: function(v) {
this.owner.setAttribute(this.name, v);
this.specified = true;
return;
}});

document.getAttributeNode = function(s) {
var n = new Attr;
n.owner = this;
n.name = s;
if(this.getAttribute(s) != undefined)
n.specified = true;
return n;
}

// The Option class, these are choices in a dropdown list.
Option = function() {
this.nodeName = "option";
this.text = this.value = "";
if(arguments.length > 0)
this.text = arguments[0];
if(arguments.length > 1)
this.value = arguments[1];
this.selected = false;
this.defaultSelected = false;
}

// Window constructor, passes the url back to edbrowse
// so it can open a new web page.
Window = function() {
var newloc = "";
var winname = "";
if(arguments.length > 0) newloc = arguments[0];
if(arguments.length > 1) winname = arguments[1];
// I only do something if opening a new web page.
// If it's just a blank window, I don't know what to do with that.
if(newloc.length)
eb$newLocation('p' + newloc+ '\n' + winname);
this.opener = window;
}

/* window.open is the same as new window, just pass the args through */
function open() {
return Window.apply(this, arguments);
}

// Document class, I don't know what to make of this,
// but my stubs for frames needs it.
Document = function(){}

CSSStyleDeclaration = function(){
        this.element = null;
        this.style = this;
	 this.attributes = new Array;
};

CSSStyleDeclaration.prototype.getPropertyValue = function(p) {
                if (this[p] == undefined)                
                        this[p] = "";
                        return this[p];
}

// pages seem to want document.style to exist
document.style = new CSSStyleDeclaration();
document.style.bgcolor = "white";

getComputedStyle = function(e,pe) {
	// disregarding pseudoelements for now
var s = new CSSStyleDeclaration;
s.element = e;
// This is a rather inefficient use of cssApply, but it is hardly ever called.
cssApply(e, s);
return s;
}

document.defaultView = function() { return window; }

document.defaultView.getComputedStyle = getComputedStyle;

// @author Originally implemented by Yehuda Katz
// And since then, from envjs, by Thatcher et al

XMLHttpRequest = function(){
    this.headers = {};
    this.responseHeaders = {};
    this.aborted = false;//non-standard
};

// defined by the standard: http://www.w3.org/TR/XMLHttpRequest/#xmlhttprequest
// but not provided by Firefox.  Safari and others do define it.
XMLHttpRequest.UNSENT = 0;
XMLHttpRequest.OPEN = 1;
XMLHttpRequest.HEADERS_RECEIVED = 2;
XMLHttpRequest.LOADING = 3;
XMLHttpRequest.DONE = 4;

XMLHttpRequest.prototype = {
open: function(method, url, async, user, password){
this.readyState = 1;
this.async = false;
// Note: async is currently hardcoded to false
// In the implementation in envjs, the line here was:
// this.async = (async === false)?false:true;

this.method = method || "GET";
this.url = eb$resolveURL(url);
this.status = 0;
this.statusText = "";
this.onreadystatechange();
},
setRequestHeader: function(header, value){
this.headers[header] = value;
},
send: function(data, parsedoc/*non-standard*/){
var headerstring = "";
for (var item in this.headers) {
var v1=item;
var v2=this.headers[item];
headerstring+=v1;
headerstring+=": ";
headerstring+=v2;
headerstring+=",";
}

var entire_http_response =  eb$fetchHTTP(this.url,this.method,headerstring,data);

var responsebody_array = entire_http_response.split("\r\n\r\n");
var http_headers = responsebody_array[0];
responsebody_array[0] = "";
var responsebody = responsebody_array.join("\r\n\r\n");
responsebody = responsebody.trim();

this.responseText = responsebody;
var hhc = http_headers.split("\r\n");
var i=0;
while (i < hhc.length) {
var value1 = hhc[i]+":";
var value2 = value1.split(":")[0];
var value3 = value1.split(":")[1];
this.responseHeaders[value2] = value3.trim();
i++;
}

try{
this.readyState = 4;
}catch(e){
}


if ((!this.aborted) && this.responseText.length > 0){
this.readyState = 4;
this.status = 200;
this.statusText = "OK";
this.onreadystatechange();
}

},
abort: function(){
this.aborted = true;
},
onreadystatechange: function(){
//Instance specific
},
getResponseHeader: function(header){
var rHeader, returnedHeaders;
if (this.readyState < 3){
throw new Error("INVALID_STATE_ERR");
} else {
returnedHeaders = [];
for (rHeader in this.responseHeaders) {
if (rHeader.match(new RegExp(header, "i"))) {
returnedHeaders.push(this.responseHeaders[rHeader]);
}
}

if (returnedHeaders.length){
return returnedHeaders.join(", ");
}
}
return null;
},
getAllResponseHeaders: function(){
var header, returnedHeaders = [];
if (this.readyState < 3){
throw new Error("INVALID_STATE_ERR");
} else {
for (header in this.responseHeaders) {
returnedHeaders.push( header + ": " + this.responseHeaders[header] );
}
}
return returnedHeaders.join("\r\n");
},
async: false,
readyState: 0,
responseText: "",
status: 0,
statusText: ""
};

// Here are the DOM classes with generic constructors.
Head = function(){}
Meta = function(){}
Link = function(){}
Body = function(){}
// Some screen attributes that are suppose to be there.
Body.prototype. clientHeight = 768;
Body.prototype. clientWidth = 1024;
Body.prototype. offsetHeight = 768;
Body.prototype. offsetWidth = 1024;
Body.prototype. scrollHeight = 768;
Body.prototype. scrollWidth = 1024;
Body.prototype. scrollTop = 0;
Body.prototype. scrollLeft = 0;
Base = function(){}
Form = function(){}
Form.prototype.submit = eb$formSubmit;
Form.prototype.reset = eb$formReset;
Element = function(){}
Image = function(){}
Frame = function(){}
Anchor = function(){}
Lister = function(){}
Listitem = function(){}
Tbody = function(){}
Table = function(){}
Div = function(){}
HtmlObj = function(){}
Area = function(){}
Span = function(){}
Trow = function(){}
Cell = function(){}
P = function(){}
Script = function(){}
Timer = function(){}

/*********************************************************************
When a script runs it may call document.write. But where to put those nodes?
I think they belong under the script object, I think that's intuitive,
but most browsers put them under body,
or at least under the parent of the script object,
but always in position, as though they were right here in place of the script.
This function lifts the nodes from the script object to its parent,
in position, just after the script.
*********************************************************************/

function eb$uplift(s)
{
var p = s.parentNode;
if(!p) return; // should never happen
var before = s.nextSibling;
while(s.firstChild)
if(before) p.insertBefore(s.firstChild, before);
else p.appendChild(s.firstChild);
}

/*********************************************************************
This creates a copy of the node and its children recursively.
The argument 'deep' refers to whether or not the clone will recurs.
eb$clone is a helper function that is not tied to any particular prototype.
*********************************************************************/

document.cloneNode = function(deep) {
return eb$clone (this,deep);
}

function eb$clone(nodeToCopy,deep)
{
var nodeToReturn;
var i;

// special case for array, which is the select node.
if(nodeToCopy instanceof Array) {
nodeToReturn = new Array;
for(i = 0; i < nodeToCopy.length; ++i)
nodeToReturn.push(eb$clone(nodeToCopy[i]));
} else {

nodeToReturn = document.createElement(nodeToCopy.nodeName);
if (deep && nodeToCopy.childNodes) {
for(i = 0; i < nodeToCopy.childNodes.length; ++i) {
var current_item = nodeToCopy.childNodes[i];
nodeToReturn.appendChild(eb$clone(current_item,true));
}
}
}

// now for the strings.
for (var item in nodeToCopy) {
if (typeof nodeToCopy[item] == 'string') {
// don't copy strings that are really setters; we'll be copying inner$html
// as a true string so won't need to copy innerHTML, and shouldn't.
if(item == "innerHTML")
continue;
if(item == "innerText")
continue;
if(item == "value" &&
!(nodeToCopy instanceof Array) && !(nodeToCopy instanceof Option))
continue;
nodeToReturn[item] = nodeToCopy[item];
}
}

// copy style object if present and its subordinate strings.
if (typeof nodeToCopy.style == "object") {
nodeToReturn.style = new CSSStyleDeclaration();
nodeToReturn.style.element = nodeToReturn;
for (var item in nodeToCopy.style){
if (typeof nodeToCopy.style[item] == 'string' ||
typeof nodeToCopy.style[item] == 'number')
nodeToReturn.style[item] = nodeToCopy.style[item];
}
}

// copy any objects of class URL.
for (var url in nodeToCopy) {
var u = nodeToCopy[url];
if(typeof u == "object" && u instanceof URL)
nodeToReturn[url] = new URL(u.href);
}

return nodeToReturn;
}

/*********************************************************************
importNode seems to be the same as cloneNode, except it is copying a tree
of objects from another context into the current context.
But this is how duktape works by default.
foo.s = cloneNode(bar.s);
If bar is in another context that's ok, we read those objects and create
copies of them in the current context.
*********************************************************************/
document.importNode = function(src, deep) { return src.cloneNode(deep); }

document.createElement = function(s) { 
var c;
var t = s.toLowerCase();
switch(t) { 
case "body":
c = new Body();
break;
case "a":
c = new Anchor();
break;
case "image":
t = "img";
case "img":
c = new Image();
break;
case "cssstyledeclaration":
case "style":
c = new CSSStyleDeclaration;
break;
case "script":
c = new Script();
break;
case "div":
c = new Div();
break;
case "p":
c = new P();
break;
case "table":
c = new Table();
break;
case "tbody":
c = new Tbody();
break;
case "tr":
c = new Trow();
break;
case "td":
c = new Cell();
break;
case "canvas":
c = new Canvas();
break;
case "select":
/* select and radio are special form elements in that they are intrinsically
 * arrays, with all the options as array elements,
 * and also "options" or "childNodes" linked to itself
 * so it looks like it has children in the usual way. */
c = new Array;
c.nodeName = t;
c.tagName = t;
c.options = c;
c.childNodes = c;
c.selectedIndex = -1;
c.value = "";
// no style, and childNodes already self-linked, so just return.
eb$logElement(c, t);
return c;
case "option":
c = new Option();
c.nodeName = t;
c.tagName = t;
// we don't log options because rebuildSelectors() checks
// the dropdown lists after every js run.
return c;
default:
/* eb$puts("createElement default " + s); */
c = new Element();
}

/* ok, for some element types this perhaps doesn't make sense,
* but for most visible ones it does and I doubt it matters much */
if(c instanceof CSSStyleDeclaration) {
c.element = c;
} else {
c.style = new CSSStyleDeclaration;
c.style.element = c;
}
c.childNodes = new Array;
c.attributes = new Array;
c.nodeName = t;
c.tagName = t;
c.nodeType = 1;
c.nodeValue = undefined;
c.class = new String;
c.className = new String;
c.ownerDocument = document;
eb$logElement(c, t);
return c;
} 

document.createDocumentFragment = function() {
var c = document.createElement("fragment");
c.nodeType = 11;
return c;
}

document.createComment = function() {
var c = document.createElement("comment");
c.nodeType = 8;
return c;
}

if(!eb$master.compiled) {
eb$master.Event = function(options){
    // event state is kept read-only by forcing
    // a new object for each event.  This may not
    // be appropriate in the long run and we'll
    // have to decide if we simply dont adhere to
    // the read-only restriction of the specification
    this._bubbles = true;
    this._cancelable = true;
    this._cancelled = false;
    this._currentTarget = null;
    this._target = null;
    this._eventPhase = Event.AT_TARGET;
    this._timeStamp = new Date().getTime();
    this._preventDefault = false;
    this._stopPropagation = false;
};

/*********************************************************************
This is our addEventListener function.
It is bound to window, which is ok because window has such a function
to listen to load and unload.
Later on we will bind it to document and to other elements via
element.addEventListener = addEventListener
Or maybe URL.prototype.addEventListener = addEventListener
to cover all the instantiated objects in one go.
first arg is a string like click, second arg is a js handler,
Third arg is not used cause I don't understand it.
*********************************************************************/

eb$master.addEventListener = function(ev, handler, notused)
{
var ev_before_changes = ev;
ev = "on" + ev;
var evarray = ev + "$$array"; // array of handlers
var evorig = ev + "$$orig"; // original handler from html
if(!this[evarray]) {
/* attaching the first handler */
var a = new Array;
/* was there already a function from before? */
if(this[ev]) {
this[evorig] = this[ev];
this[ev] = undefined;
}
this[evarray] = a;
eval(
'this.' + ev + ' = function(){ var a = this.' + evarray + '; if(this.' + evorig + ') this.' + evorig + '(); for(var i = 0; i<a.length; ++i) {var tempEvent = new Event;tempEvent.type = "' + ev_before_changes + '";a[i](tempEvent);} };');
}
this[evarray].push(handler);
}

// here is remove, the opposite of add.
// what if every handler is removed and there is an empty array?
// the assumption is that this is not a problem
eb$master.removeEventListener = function(ev, handler, notused)
{
ev = "on" + ev;
var evarray = ev + "$$array"; // array of handlers
var evorig = ev + "$$orig"; // original handler from html
// remove original html handler after other events have been added.
if(this[evorig] == handler) {
delete this[evorig];
return;
}
// remove original html handler when no other events have been added.
if(this[ev] == handler) {
delete this[ev];
return;
}
// If other events have been added, check through the array.
if(this[evarray]) {
var a = this[evarray]; // shorthand
for(var i = 0; i<a.length; ++i)
if(a[i] == handler) {
a.splice(i, 1);
return;
}
}
}

// For grins let's put in the other standard.
eb$master. attachEvent = function(ev, handler)
{
var evarray = ev + "$$array"; // array of handlers
var evorig = ev + "$$orig"; // original handler from html
if(!this[evarray]) {
/* attaching the first handler */
var a = new Array;
/* was there already a function from before? */
if(this[ev]) {
this[evorig] = this[ev];
this[ev] = undefined;
}
this[evarray] = a;
eval(
'this.' + ev + ' = function(){ var a = this.' + evarray + '; if(this.' + evorig + ') this.' + evorig + '(); for(var i = 0; i<a.length; ++i) {var tempEvent = new Event;tempEvent.type = "' + ev + '";a[i](tempEvent);} };');
}
this[evarray].push(handler);
}

} // master compile

Event = eb$master.Event;
addEventListener = eb$master.addEventListener;
removeEventListener = eb$master.removeEventListener;
attachEvent = eb$master.attachEvent;

document.addEventListener = window.addEventListener;
document.removeEventListener = window.removeEventListener;
document.attachEvent = window.attachEvent;

// Some websites expect an onhashchange handler from the get-go.
onhashchange = eb$truefunction;

(function() {
for(var cn in {Body, Form, Element, Anchor}) {
var c = window[cn];
// c is class and cn is classname.
c.prototype.addEventListener = window.addEventListener;
c.prototype.removeEventListener = window.removeEventListener;
c.prototype.attachEvent = window.attachEvent;
}
})();

// Add prototype methods to the standard nodes, nodes that have children,
// and the normal set of methods to go with those children.
// Form has children for sure, but if we add <input> to Form,
// we also have to add it to the array Form.elements.
// So there are some nodes that we have to do outside this loop.
for(var cn in {HtmlObj, Head, Body, CSSStyleDeclaration, Frame,
Anchor, Element, Lister, Listitem, Tbody, Table, Div,
Span, Trow, Cell, P, Script,
// The following nodes shouldn't have any children, but the various
// children methods could be called on them anyways.
Area, TextNode, Image, Option, Link, Meta}) {
var c = window[cn];
// c is class and cn is classname.
// get elements below
c.prototype.getElementsByTagName = document.getElementsByTagName;
c.prototype.getElementsByName = document.getElementsByName;
c.prototype.getElementsByClassName = document.getElementsByClassName;
// children
c.prototype.hasChildNodes = document.hasChildNodes;
c.prototype.appendChild = document.appendChild;
c.prototype.eb$apch1 = document.eb$apch1;
c.prototype.eb$apch2 = document.eb$apch2;
c.prototype.insertBefore = document.insertBefore;
c.prototype.eb$insbf = document.eb$insbf;
c.prototype.removeChild = document.removeChild;
c.prototype.replaceChild = document.replaceChild;
Object.defineProperty(c.prototype, "firstChild", { get: function() { return this.childNodes[0]; } });
Object.defineProperty(c.prototype, "lastChild", { get: function() { return this.childNodes[this.childNodes.length-1]; } });
Object.defineProperty(c.prototype, "nextSibling", { get: function() { return eb$master.eb$getSibling(this,"next"); } });
Object.defineProperty(c.prototype, "previousSibling", { get: function() { return eb$master.eb$getSibling(this,"previous"); } });
// attributes
c.prototype.hasAttribute = document.hasAttribute;
c.prototype.getAttribute = document.getAttribute;
c.prototype.setAttribute = document.setAttribute;
c.prototype.removeAttribute = document.removeAttribute;
c.prototype.getAttributeNode = document.getAttributeNode;
// clone
c.prototype.cloneNode = document.cloneNode;
c.prototype.importNode = document.importNode;
// visual
c.prototype.focus = focus;
c.prototype.blur = blur;
}

/*********************************************************************
As promised, Form is weird.
If you add an input to a form, it adds under childNodes in the usual way,
but also must add in the elements[] array.
Same for insertBefore and removeChild.
When adding an input element to a form,
linnk form[element.name] to that element.
*********************************************************************/

Form.prototype.getElementsByTagName = document.getElementsByTagName;
Form.prototype.getElementsByName = document.getElementsByName;
Form.prototype.getElementsByClassName = document.getElementsByClassName;

function eb$formname(parent, child)
{
var s;
if(typeof child.name == "string")
s = child.name;
else if(typeof child.id == "string")
s = child.id;
else return;
// Is it ok if name is "action"? I'll assume it is,
// but then there is no way to submit the form. Oh well.
parent[s] = child;
}

Form.prototype.appendChildNative = document.appendChild;
Form.prototype.appendChild = function(newobj) {
this.appendChildNative(newobj);
if(newobj.nodeName === "input" || newobj.nodeName === "select") {
this.elements.appendChild(newobj);
eb$formname(this, newobj);
}
}
Form.prototype.eb$apch1 = document.eb$apch1;
Form.prototype.eb$apch2 = document.eb$apch2;
Form.prototype.eb$insbf = document.eb$insbf;
Form.prototype.insertBeforeNative = document.insertBefore;
Form.prototype.insertBefore = function(newobj, item) {
this.insertBeforeNative(newobj, item);
if(newobj.nodeName === "input" || newobj.nodeName === "select") {
// the following won't work unless item is also type input.
this.elements.insertBefore(newobj, item);
eb$formname(this, newobj);
}
}
Form.prototype.hasChildNodes = document.hasChildNodes;
Form.prototype.removeChildNative = document.removeChild;
Form.prototype.removeChild = function(item) {
this.removeChildNative(item);
if(item.nodeName === "input" || item.nodeName === "select")
this.elements.removeChild(item);
}
Form.prototype.replaceChild = document.replaceChild;
Object.defineProperty(Form.prototype, "firstChild", { get: function() { return this.childNodes[0]; } });
Object.defineProperty(Form.prototype, "lastChild", { get: function() { return this.childNodes[this.childNodes.length-1]; } });
Object.defineProperty(Form.prototype, "nextSibling", { get: function() { return eb$master.eb$getSibling(this,"next"); } });
Object.defineProperty(Form.prototype, "previousSibling", { get: function() { return eb$master.eb$getSibling(this,"previous"); } });

Form.prototype.getAttribute = document.getAttribute;
Form.prototype.setAttribute = document.setAttribute;
Form.prototype.hasAttribute = document.hasAttribute;
Form.prototype.removeAttribute = document.removeAttribute;
Form.prototype.getAttributeNode = document.getAttributeNode;

Form.prototype.cloneNode = document.cloneNode;
Form.prototype.importNode = document.importNode;

/* The select element in a form is itself an array, so the children functions have
 * to be on array prototype, except appendchild is to have no side effects,
 * because select options are maintained by rebuildSelectors(), so appendChild
 * is just array.push(). */
Array.prototype.appendChild = function(child) {
// check to see if it's already there
for(var i=0; i<this.length; ++i)
if(this[i] == child)
return child;
this.push(child);return child; }
/* insertBefore maps to splice, but we have to find the element. */
/* This prototype assumes all elements are objects. */
Array.prototype.insertBefore = function(newobj, item) {
// check to see if it's already there
for(var i=0; i<this.length; ++i)
if(this[i] == newobj)
return newobj;
for(var i=0; i<this.length; ++i)
if(this[i] == item) {
this.splice(i, 0, newobj);
return newobj;
}
}
Array.prototype.removeChild = function(item) {
for(var i=0; i<this.length; ++i)
if(this[i] == item) {
this.splice(i, 1);
return;
}
}
Array.prototype.hasChildNodes = document.hasChildNodes;
Array.prototype.replaceChild = document.replaceChild;
Object.defineProperty(Array.prototype, "firstChild", { get: function() { return this[0]; } });
Object.defineProperty(Array.prototype, "lastChild", { get: function() { return this[this.length-1]; } });
Object.defineProperty(Array.prototype, "nextSibling", { get: function() { return eb$master.eb$getSibling(this,"next"); } });
Object.defineProperty(Array.prototype, "previousSibling", { get: function() { return eb$master.eb$getSibling(this,"previous"); } });

Array.prototype.getAttribute = document.getAttribute;
Array.prototype.setAttribute = document.setAttribute;
Array.prototype.hasAttribute = document.hasAttribute;
Array.prototype.removeAttribute = document.removeAttribute;
Array.prototype.getAttributeNode = document.getAttributeNode;
Array.prototype.item = function(x) { return this[x] };

// Deminimize javascript for debugging purposes.
// Then the line numbers in the error messages actually mean something.
// This is only called when debugging is on. Users won't invoke this machinery.
// Argument is the script object.
// escodegen.generate and esprima.parse are found in third.js.
if(!eb$master.compiled) {
eb$master.eb$demin = function(s)
{
if(! s instanceof Script) return;
if(s.demin) return; // already expanded
s.demin = true;
s.expanded = false;
if(! s.data) return;
if(! s.src) return;

// If the script is original source, then deminimizing it makes things worse.
// Don't deminimize if average line length is less than 1000.
var i, linecount = 0;
for(i=0; i<s.data.length; ++i)
if(s.data.substr(i,1) === '\n') ++linecount;
if(s.data.length / linecount <= 1000) return;

// Ok, run it through the deminimizer.
s.original = s.data;
s.data = escodegen.generate(esprima.parse(s.data));
s.expanded = true;
}
} // master compile
eb$demin = eb$master.eb$demin;

// Canvas method draws a picture. That's meaningless for us,
// but it still has to be there.
if(!eb$master.compiled) {
eb$master.Canvas = function() {
this.getContext = { beginPath: eb$nullfunction, moveTo: eb$nullfunction, lineTo: eb$nullfunction, stroke:eb$nullfunction};
}
} // master compile
Canvas = eb$master.Canvas;

