document.addEventListener('DOMContentLoaded', () => {
    const navButton = document.querySelector('button.menu-button')
    const overlay = document.querySelector('.navigation-overlay')
    const navPanel = document.querySelector('nav.navigation-panel')

    if (navButton) {
        navButton.addEventListener('click', () => toggleNav([overlay, navPanel]))
    }
    if (overlay) {
        overlay.addEventListener('click', () => toggleNav([overlay, navPanel]))
    }
})
const appState = {
    isNavOpen: false
}

function toggleNav(elements) {
    appState.isNavOpen = !appState.isNavOpen
    elements.forEach(elm => {
        appState.isNavOpen
            ? elm.classList.add('open')
            : elm.classList.remove('open')
    })
}