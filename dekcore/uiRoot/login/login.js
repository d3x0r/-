
(function login() {
    var cover = document.createElement( "div" );
    cover.style.position = "absolute";
    cover.style.width = "100%"
    cover.style.height = "100%"

    var pages = document.createElement( "iframe" );
    pages.src = "login/login.html"
    pages.addEventListener( "load", pagesLoaded );
    cover.style.position = "absolute";
    cover.style.width = "100%"
    cover.style.height = "100%"
    cover.appendChild( pages );

    function pagesLoaded() {
        var pageRoot = pages.contentWindow.document
    }

})();