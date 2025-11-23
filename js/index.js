document.addEventListener("DOMContentLoaded", function () {
  const scrollIndicator = document.getElementById("scrollIndicator");
  const videoHero = document.querySelector(".video-hero");
  const heroSection = document.querySelector(".hero");
  function controlScrollbar() {
    const videoHeroRect = videoHero.getBoundingClientRect();
    const isVideoHeroVisible =
      videoHeroRect.top >= -100 && videoHeroRect.bottom > 0;
    if (isVideoHeroVisible) {
      document.body.classList.add("video-hero-active");
      scrollIndicator.style.opacity = "0.8";
    } else {
      document.body.classList.remove("video-hero-active");
      scrollIndicator.style.opacity = "0";
    }
  }
  function scrollToNextSection() {
    heroSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
  scrollIndicator.addEventListener("click", scrollToNextSection);
  window.addEventListener("scroll", controlScrollbar);
  controlScrollbar();
});
document.addEventListener("DOMContentLoaded", function () {
  const progressFill = document.querySelector(".progress-fill");
  const loadingScreen = document.querySelector(".loading-screen");
  const content = document.querySelector(".content");
  let progress = 0;
  const loadingInterval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 100) progress = 100;
    progressFill.style.width = progress + "%";
    if (progress === 100) {
      clearInterval(loadingInterval);
      setTimeout(() => {
        loadingScreen.classList.add("loaded");
        setTimeout(() => {
          loadingScreen.style.display = "none";
          content.style.opacity = "1";
          document.body.style.overflow = "auto";
        }, 800);
      }, 300);
    }
  }, 150);
});
document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.querySelector(".navbar");
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.querySelector(".navbar nav");
  const userMenu = document.getElementById("userMenu");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const authButtons = document.getElementById("authButtons");
  function isHomePage() {
    return (
      window.location.pathname.endsWith("/index.html") ||
      window.location.pathname === "/" ||
      window.location.pathname.endsWith("/")
    );
  }
  function isMobile() {
    return window.innerWidth <= 768;
  }
  function handleNavbarStyle() {
    const isHome = isHomePage();
    const isMobileView = isMobile();
    if (isHome && !isMobileView) {
      if (window.scrollY > 10) {
        navbar.classList.remove("transparent");
        navbar.classList.add("solid");
      } else {
        navbar.classList.add("transparent");
        navbar.classList.remove("solidFlex");
      }
    } else {
      navbar.classList.add("solidFlex");
      navbar.classList.remove("transparent");
    }
  }
  handleNavbarStyle();
  function handleScroll() {
    if (isHomePage() && !isMobile()) {
      if (window.scrollY > 10) {
        navbar.classList.remove("transparent");
        navbar.classList.add("solid");
      } else {
        navbar.classList.add("transparent");
        navbar.classList.remove("solid");
      }
    }
  }
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", function () {
    handleNavbarStyle();
  });
  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      navMenu.classList.toggle("active");
    });
  }
  document.addEventListener("click", function (event) {
    if (
      navMenu &&
      !navMenu.contains(event.target) &&
      menuToggle &&
      !menuToggle.contains(event.target) &&
      navMenu.classList.contains("active")
    ) {
      navMenu.classList.remove("active");
    }
  });
  if (userMenu && dropdownMenu) {
    userMenu.addEventListener("click", function (event) {
      event.stopPropagation();
      dropdownMenu.classList.toggle("active");
    });
    document.addEventListener("click", function (event) {
      if (
        !dropdownMenu.contains(event.target) &&
        !userMenu.contains(event.target) &&
        dropdownMenu.classList.contains("active")
      ) {
        dropdownMenu.classList.remove("active");
      }
    });
  }
});
