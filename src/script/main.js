document.addEventListener("DOMContentLoaded", () => {
  const navButton = document.querySelector("button.menu-button");
  const overlay = document.querySelector(".navigation-overlay");
  const navPanel = document.querySelector("nav.navigation-panel");
  const closeButton = document.querySelector("button.menu-close");

  // const subNavBtns = document.querySelectorAll(".subnav-btn");
  // if (subNavBtns) {
  //   subNavBtns.forEach((btn) => {
  //     console.log(btn);
  //     addEventListener("click", (e) => {
  //       e.preventDefault();
  //       openSubNav(btn);
  //     });
  //   });
  // }

  if (navButton) {
    navButton.addEventListener("click", () => toggleNav([overlay, navPanel]));
  }
  if (overlay) {
    overlay.addEventListener("click", () => toggleNav([overlay, navPanel]));
    closeButton.addEventListener("click", () => toggleNav([overlay, navPanel]));
  }
});
const appState = {
  isNavOpen: false,
};

function toggleNav(elements) {
  appState.isNavOpen = !appState.isNavOpen;
  elements.forEach((elm) => {
    appState.isNavOpen
      ? elm.classList.add("open")
      : elm.classList.remove("open");
  });
}

function openSubNav(btn) {
  btn.closest("li").toggleAttribute("active");
}
