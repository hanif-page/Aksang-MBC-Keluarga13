const btn = document.querySelector(".action-button");

btn.addEventListener("click", () => {
    if(!btn.classList.contains("button-disabled")){
        console.log("Hello");
    }
})