/* =========================================================
   Portfolio de Enzo · Interacciones y animaciones
   - Cabecera que se oculta al bajar y aparece al subir
   - Botón "Copiar email"
   - Brillo que sigue al ratón en las tarjetas de servicios
   - Animaciones con GSAP + ScrollTrigger (respetando
     prefers-reduced-motion)
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var header = document.getElementById('cabecera');

  /* ---------- 1. Cabecera inteligente ---------- */
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    // Umbral de 6 px para evitar parpadeos con scroll muy fino
    if (Math.abs(y - lastY) > 6) {
      header.classList.toggle('is-hidden', y > lastY && y > 200);
      lastY = y;
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  // Si se navega con teclado por la cabecera, se muestra
  header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });

  /* ---------- 2. Copiar email ---------- */
  var copyBtn = document.querySelector('.copy-btn');
  var copyLabel = copyBtn.querySelector('.copy-btn__label');
  var copyStatus = document.querySelector('.copy-status');
  var copyTimer;

  copyBtn.addEventListener('click', function () {
    var email = copyBtn.dataset.email;
    var done = function () {
      copyBtn.classList.add('is-copied');
      copyLabel.textContent = '¡Copiado!';
      copyStatus.textContent = 'Email copiado al portapapeles';
      clearTimeout(copyTimer);
      copyTimer = setTimeout(function () {
        copyBtn.classList.remove('is-copied');
        copyLabel.textContent = 'Copiar email';
        copyStatus.textContent = '';
      }, 2200);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(done, function () { window.prompt('Copia el email:', email); });
    } else {
      window.prompt('Copia el email:', email);
    }
  });

  /* ---------- 3. Brillo que sigue al ratón en los servicios ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.service').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  // Año actual en el footer
  document.getElementById('anio').textContent = new Date().getFullYear();

  /* ---------- 4. Animaciones con GSAP ---------- */
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove('anim'); // si el CDN falla, todo visible sin animación
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();

  mm.add({
    motion: '(prefers-reduced-motion: no-preference)',
    desktop: '(min-width: 1024px)'
  }, function (ctx) {
    if (!ctx.conditions.motion) return; // movimiento reducido: no se anima nada
    root.classList.add('anim');
    var isDesktop = ctx.conditions.desktop;

    /* 4.1 Entrada del hero */
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .fromTo('.hero__status', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8 }, 0.1)
      .fromTo('.hero .line__inner', { yPercent: 105, y: 0 }, { yPercent: 0, duration: 1.1, stagger: 0.12 }, 0.2)
      .fromTo('.hero__lead', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9 }, 0.7)
      .fromTo('.hero__actions', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9 }, 0.82)
      .fromTo('.hero__visual', { opacity: 0, y: 60, rotate: isDesktop ? 2 : 0 }, { opacity: 1, y: 0, rotate: 0, duration: 1.4 }, 0.5);

    /* 4.2 Parallax de las maquetas: el móvil se mueve más que el navegador */
    var parallax = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero__browser', { y: -40, ease: 'none', scrollTrigger: parallax });
    gsap.to('.hero__phone', { y: -110, ease: 'none', scrollTrigger: parallax });

    /* 4.3 Imagen del proyecto: se "descubre" de abajo arriba */
    // Cada proyecto tiene su propio disparador
    document.querySelectorAll('.project').forEach(function (project) {
      gsap.fromTo(project.querySelector('.project__media'),
        { clipPath: 'inset(12% 6% 12% 6% round 14px)', opacity: 0.4 },
        { clipPath: 'inset(0% 0% 0% 0% round 14px)', opacity: 1, ease: 'none',
          scrollTrigger: { trigger: project, start: 'top 85%', end: 'top 35%', scrub: 0.6 } });
    });

    /* 4.4 Línea del proceso que se rellena con el scroll */
    gsap.to('.steps__progress', {
      scaleX: 1, // escritorio: la línea es horizontal
      scaleY: 1, // móvil: la línea es vertical
      ease: 'none',
      scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 60%', scrub: 0.5 }
    });

    /* 4.5 Aparición con fade + desplazamiento al hacer scroll */
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.1,
          overwrite: true,
          onComplete: function () {
            // Se limpian los estilos en línea para no bloquear los hover de CSS
            batch.forEach(function (el) { el.classList.add('is-revealed'); });
            gsap.set(batch, { clearProps: 'opacity,transform' });
          }
        });
      }
    });

    return function () { root.classList.remove('anim'); };
  });

  // Recalcula posiciones cuando cargan las fuentes
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
