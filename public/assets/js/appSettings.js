document.addEventListener("DOMContentLoaded", () => {
    
	const { appTheme, appSidebar, appColor, appLayout, appBoxed } = appSettings;
	
	switch (appTheme) {
        case "light":
            document.documentElement.setAttribute("data-bs-theme", "light");
            break;
        case "dark":
            document.documentElement.setAttribute("data-bs-theme", "dark");
            break;
        default:
            document.documentElement.setAttribute("data-bs-theme", "light");
    }
	
	// Sidebar - handle based on screen width
    if (window.innerWidth >= 1191) {
        switch (appSidebar) {
            case "full":
                document.documentElement.setAttribute("data-app-sidebar", "full");
                break;
            case "mini":
                document.documentElement.setAttribute("data-app-sidebar", "mini");
                break;
            default:
                document.documentElement.setAttribute("data-app-sidebar", "full");
        }
    }
	
	switch (appColor) {
        case "blue":
            document.documentElement.setAttribute("data-color-theme", "blue");
            break;
        case "green":
            document.documentElement.setAttribute("data-color-theme", "green");
            break;
        default:
            document.documentElement.setAttribute("data-color-theme", "blue");
    }	

});

const appSettings = {
    appTheme: 'light',
    appSidebar: 'full',
    appColor: 'blue',
};