
function setupElements() {
    // Disable canvas right click menu
    // document.getElementById("p5canvas")
    //     .addEventListener("contextmenu", (e) => e.preventDefault());

    const animespeed = document.getElementById("animespeed");
    const animelabel = document.getElementById("animelabel");

    animespeed.addEventListener("input", (e)=>{
        let value = parseFloat(animespeed.value);
        if (value > 0.9) value = 1;
        animelabel.innerHTML = "Animation Speed: " + (value == 1 ? "none" : value);
        Animator.speed = value;
    });

    data.settingsVisible = true;
}

function toggleSettings() {
    const settings = document.getElementById("settings");
    data.settingsVisible = !data.settingsVisible;
    settings.style.visibility = data.settingsVisible ? "visible" : "hidden";
}
