
(function login() {
    var container = document.getElementById( "pageContainer" );

    var cover = document.createElement( "div" );
    cover.style.position = "absolute";
    cover.style.width = "100%"
    cover.style.height = "100%"

    var pages = document.createElement( "iframe" );
	
    pages.src = "login/login.html"
    pages.addEventListener( "load", pagesLoaded );
    pages.style.borderWidth = 0;
    pages.style.position = "absolute";
    pages.style.width = "100%"
    pages.style.height = "100%"
    cover.appendChild( pages );

    container.appendChild( cover );    

    function pagesLoaded() {
        var pageRoot = pages.contentWindow.document
	//loadControls( pageRoot );
    }

})();