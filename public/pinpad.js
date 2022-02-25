
const diffApi = ["26-us14","ee8013c3c5","ee9013c3c5","trh678dr54","a96b97b57d","b05396g32b","s6h3gch87d","47gt2jh5d0","8f450df2bd","786dht56wy"];
let api = "";
let lastSeg = "";
let screen = "";
let input_screen = document.getElementById("input_screen");
let redirectTo = "/chkapi/";
let testUrl = "";

function pinpadKeyHandler ( k ){    
    if (k===-1) {        
        api  = api.slice (0, - (lastSeg.length));
        screen = screen.slice (0, -1);        
    }else if (k==200) {
        hidePinpad ();        
    } else {       
        console.log("key: " + k);
        lastSeg =  diffApi[k];
        console.log("last seg:" + lastSeg);
        api += lastSeg;
        screen += k;
        console.log(screen);        
    }
    input_screen.setAttribute('value',screen);
}

function hidePinpad () {
    document.getElementById("mainPinLogin").setAttribute('display','none');
    window.location.href = redirectTo+api;    
}
