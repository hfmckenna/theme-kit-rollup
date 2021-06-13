import SearchDrawer from '../global/searchdrawer'
import MobileNav from '../global/mobilenav'
import Header from '../global/header'

const HeaderSection = function () {

    this.onLoad = function () {
        Header.init();
        MobileNav.init();
        SearchDrawer.init();
        theme.Search.init();
    }

    this.onUnload = function () {
        Header.unload();
        theme.Search.unload();
        MobileNav.unload();
    }

};

export default HeaderSection;