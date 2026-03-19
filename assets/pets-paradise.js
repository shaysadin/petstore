/**
 * Pets Paradise - Theme JavaScript
 * Handles: Carousel, Quantity Selectors, Add to Cart, Cart Count
 */
(function () {
  'use strict';

  /* ===========================
     CART TOAST NOTIFICATION
     =========================== */
  var toastEl = null;
  var toastTimer = null;

  function ensureToast() {
    if (toastEl) return toastEl;
    var div = document.createElement('div');
    div.className = 'pp-cart-toast';
    div.id = 'ppCartToast';
    div.innerHTML =
      '<div class="pp-cart-toast__icon">\u2713</div>' +
      '<span class="pp-cart-toast__text"></span>' +
      '<button class="pp-cart-toast__close" aria-label="\u05E1\u05D2\u05D5\u05E8">&times;</button>';
    document.body.appendChild(div);
    div.querySelector('.pp-cart-toast__close').addEventListener('click', function () {
      div.classList.remove('active');
    });
    toastEl = div;
    return div;
  }

  function showToast(message) {
    var toast = ensureToast();
    toast.querySelector('.pp-cart-toast__text').textContent = message;
    clearTimeout(toastTimer);
    toast.classList.add('active');
    toastTimer = setTimeout(function () {
      toast.classList.remove('active');
    }, 3500);
  }

  /* ===========================
     CART COUNT UPDATE
     =========================== */
  function updateCartCount(count) {
    var badge = document.getElementById('ppCartCount');
    if (badge) {
      badge.textContent = count;
      badge.setAttribute('data-count', count);
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
    document.querySelectorAll('.pp-mobile-cart-count').forEach(function (el) {
      el.textContent = count;
    });
    document.querySelectorAll('.header-button .badge').forEach(function (el) {
      el.textContent = count;
    });
  }

  /* ===========================
     QUANTITY SELECTOR
     =========================== */
  document.addEventListener('click', function (e) {
    var plusBtn = e.target.closest('.pp-qty__plus');
    var minusBtn = e.target.closest('.pp-qty__minus');

    if (plusBtn) {
      var countEl = plusBtn.closest('.pp-qty').querySelector('.pp-qty__count');
      var val = parseInt(countEl.textContent, 10) || 1;
      countEl.textContent = val + 1;
    }
    if (minusBtn) {
      var countEl2 = minusBtn.closest('.pp-qty').querySelector('.pp-qty__count');
      var val2 = parseInt(countEl2.textContent, 10) || 1;
      if (val2 > 1) countEl2.textContent = val2 - 1;
    }
  });

  /* ===========================
     ADD TO CART
     =========================== */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.pp-add-to-cart');
    if (!btn || btn.disabled) return;

    var variantId = btn.getAttribute('data-variant-id');
    var productTitle = btn.getAttribute('data-product-title');
    if (!variantId) return;

    var actionsEl = btn.closest('.pp-product-card__actions');
    var qtyEl = actionsEl ? actionsEl.querySelector('.pp-qty__count') : null;
    var quantity = qtyEl ? parseInt(qtyEl.textContent, 10) || 1 : 1;

    var originalText = btn.textContent;
    btn.classList.add('is-loading');
    btn.textContent = '...';

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: parseInt(variantId, 10),
        quantity: quantity
      })
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Add to cart failed');
        return response.json();
      })
      .then(function () {
        btn.classList.remove('is-loading');
        btn.classList.add('is-added');
        btn.textContent = '\u2713 \u05E0\u05D5\u05E1\u05E3';
        showToast((productTitle || '\u05DE\u05D5\u05E6\u05E8') + ' \u05E0\u05D5\u05E1\u05E3 \u05DC\u05E1\u05DC');

        if (typeof window.ppOpenCartSidebar === 'function') {
          window.ppOpenCartSidebar();
        }

        return fetch('/cart.js');
      })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartCount(cart.item_count);
      })
      .catch(function () {
        btn.classList.remove('is-loading');
        btn.textContent = originalText;
        showToast('\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D4\u05D5\u05E1\u05E4\u05D4 \u05DC\u05E1\u05DC');
      })
      .finally(function () {
        setTimeout(function () {
          btn.classList.remove('is-added');
          btn.textContent = originalText;
        }, 2000);
      });
  });

  /* ===========================
     INFINITE CAROUSEL
     =========================== */
  function initCarousels() {
    document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
      if (carousel._ppInit) return;
      carousel._ppInit = true;

      var viewport = carousel.querySelector('[data-carousel-viewport]');
      var track = carousel.querySelector('[data-carousel-track]');
      var prevBtn = carousel.querySelector('[data-carousel-prev]');
      var nextBtn = carousel.querySelector('[data-carousel-next]');
      var slides = Array.from(track.querySelectorAll('.pp-carousel__slide'));

      if (slides.length === 0) return;

      // Clone slides for infinite loop
      var cloneCount = Math.min(slides.length, 6);

      // Append clones to the end
      for (var i = 0; i < cloneCount; i++) {
        var clone = slides[i].cloneNode(true);
        clone.setAttribute('data-clone', 'true');
        track.appendChild(clone);
      }
      // Prepend clones from the end
      for (var j = slides.length - 1; j >= Math.max(0, slides.length - cloneCount); j--) {
        var clone2 = slides[j].cloneNode(true);
        clone2.setAttribute('data-clone', 'true');
        track.insertBefore(clone2, track.firstChild);
      }

      var allSlides = Array.from(track.querySelectorAll('.pp-carousel__slide'));
      var prependedCount = cloneCount;

      function getSlideWidth() {
        var slide = allSlides[0];
        if (!slide) return 360;
        var style = getComputedStyle(track);
        var gap = parseInt(style.gap, 10) || 40;
        return slide.offsetWidth + gap;
      }

      var currentIndex = prependedCount; // Start at first real slide
      var slideWidth = getSlideWidth();
      var autoInterval = null;
      var isDragging = false;
      var startX = 0;
      var dragOffset = 0;
      var lastDragX = 0;
      var currentTranslate = 0;

      // For RTL: we use positive translateX to move left (showing next items)
      // The track is set to direction:ltr to simplify calculations
      function applyPosition(animate) {
        slideWidth = getSlideWidth();
        currentTranslate = -(currentIndex * slideWidth);
        if (animate) {
          track.classList.remove('no-transition');
        } else {
          track.classList.add('no-transition');
        }
        track.style.transform = 'translateX(' + currentTranslate + 'px)';
        if (!animate) {
          // Force reflow
          track.offsetHeight;
          track.classList.remove('no-transition');
        }
      }

      // Set initial position
      applyPosition(false);

      function checkBounds() {
        // If we've scrolled into the appended clones, jump to real start
        if (currentIndex >= prependedCount + slides.length) {
          currentIndex -= slides.length;
          applyPosition(false);
        }
        // If we've scrolled into the prepended clones, jump to real end
        if (currentIndex < prependedCount) {
          currentIndex += slides.length;
          applyPosition(false);
        }
      }

      function goNext() {
        currentIndex++;
        applyPosition(true);
        track.addEventListener('transitionend', function handler() {
          track.removeEventListener('transitionend', handler);
          checkBounds();
        });
      }

      function goPrev() {
        currentIndex--;
        applyPosition(true);
        track.addEventListener('transitionend', function handler() {
          track.removeEventListener('transitionend', handler);
          checkBounds();
        });
      }

      // In RTL visual: "next" arrow (left arrow) should advance forward
      if (nextBtn) nextBtn.addEventListener('click', function () { goNext(); resetAuto(); });
      if (prevBtn) prevBtn.addEventListener('click', function () { goPrev(); resetAuto(); });

      // Navigation dots
      var dotsContainer = document.createElement('div');
      dotsContainer.className = 'pp-carousel__dots';
      for (var d = 0; d < slides.length; d++) {
        var dot = document.createElement('button');
        dot.className = 'pp-carousel__dot';
        dot.setAttribute('aria-label', 'Slide ' + (d + 1));
        dot.setAttribute('data-slide-index', d);
        if (d === 0) dot.classList.add('active');
        dot.addEventListener('click', function () {
          var idx = parseInt(this.getAttribute('data-slide-index'), 10);
          currentIndex = prependedCount + idx;
          applyPosition(true);
          updateDots();
          resetAuto();
          track.addEventListener('transitionend', function handler() {
            track.removeEventListener('transitionend', handler);
            checkBounds();
          });
        });
        dotsContainer.appendChild(dot);
      }
      carousel.appendChild(dotsContainer);

      function updateDots() {
        var realIndex = (currentIndex - prependedCount) % slides.length;
        if (realIndex < 0) realIndex += slides.length;
        var dots = dotsContainer.querySelectorAll('.pp-carousel__dot');
        dots.forEach(function (dot, i) {
          dot.classList.toggle('active', i === realIndex);
        });
      }

      // Patch goNext/goPrev to update dots
      var _origGoNext = goNext;
      var _origGoPrev = goPrev;
      goNext = function () { _origGoNext(); updateDots(); };
      goPrev = function () { _origGoPrev(); updateDots(); };

      // Auto-scroll
      function startAuto() {
        stopAuto();
        autoInterval = setInterval(function () {
          goNext();
        }, 4000);
      }

      function stopAuto() {
        if (autoInterval) {
          clearInterval(autoInterval);
          autoInterval = null;
        }
      }

      function resetAuto() {
        stopAuto();
        startAuto();
      }

      // Drag/swipe support
      function onDragStart(x) {
        isDragging = true;
        startX = x;
        lastDragX = x;
        dragOffset = 0;
        viewport.classList.add('is-dragging');
        track.classList.add('no-transition');
        stopAuto();
      }

      function onDragMove(x) {
        if (!isDragging) return;
        var dx = x - lastDragX;
        lastDragX = x;
        dragOffset = x - startX;
        currentTranslate += dx;
        track.style.transform = 'translateX(' + currentTranslate + 'px)';
      }

      function onDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        viewport.classList.remove('is-dragging');
        track.classList.remove('no-transition');

        slideWidth = getSlideWidth();

        if (Math.abs(dragOffset) > slideWidth * 0.15) {
          if (dragOffset < 0) {
            // Dragged left = go next (in LTR track)
            currentIndex += Math.max(1, Math.round(Math.abs(dragOffset) / slideWidth));
          } else {
            // Dragged right = go prev
            currentIndex -= Math.max(1, Math.round(Math.abs(dragOffset) / slideWidth));
          }
        }

        applyPosition(true);
        updateDots();

        track.addEventListener('transitionend', function handler() {
          track.removeEventListener('transitionend', handler);
          checkBounds();
          updateDots();
        });

        startAuto();
      }

      // Mouse events
      viewport.addEventListener('mousedown', function (e) {
        e.preventDefault();
        onDragStart(e.clientX);
      });
      window.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        onDragMove(e.clientX);
      });
      window.addEventListener('mouseup', function () {
        onDragEnd();
      });

      // Touch events
      viewport.addEventListener('touchstart', function (e) {
        onDragStart(e.touches[0].clientX);
      }, { passive: true });
      viewport.addEventListener('touchmove', function (e) {
        onDragMove(e.touches[0].clientX);
      }, { passive: true });
      viewport.addEventListener('touchend', function () {
        onDragEnd();
      });

      // Prevent link clicks during drag
      viewport.addEventListener('click', function (e) {
        if (Math.abs(dragOffset) > 5) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      // Pause on hover
      carousel.addEventListener('mouseenter', stopAuto);
      carousel.addEventListener('mouseleave', startAuto);

      // Handle resize
      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          applyPosition(false);
        }, 200);
      });

      // Start auto-scroll
      startAuto();
    });
  }

  /* ===========================
     INIT ON DOM READY
     =========================== */
  function initCategoryScroll() {
    // No-op, handled by CSS
  }

  function init() {
    initCarousels();
    initCategoryScroll();

    // Fetch initial cart count
    fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartCount(cart.item_count);
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ===========================
     SCROLL ANIMATIONS
     =========================== */
  function initScrollAnimations() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Single observer for all reveal elements
    var observer = new IntersectionObserver(function(entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('pp-visible');
          observer.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

    // Word observer for blur-in headings — chains siblings after words finish
    var wordObserver = new IntersectionObserver(function(entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          var heading = entries[i].target;
          var words = heading.querySelectorAll('.pp-blur-word');
          for (var j = 0; j < words.length; j++) words[j].classList.add('pp-word-visible');

          // Chain: reveal text siblings (skip SVGs, structural divs)
          var totalWordTime = words.length * 90 + 350;
          var parent = heading.parentElement;
          if (parent) {
            var skipTags = ['SVG', 'DIV'];
            var skipClasses = ['pp-best-sellers__cream-top', 'pp-category-wave__svg-top', 'pp-carousel'];
            var delay = totalWordTime;
            for (var s = 0; s < parent.children.length; s++) {
              var sib = parent.children[s];
              if (sib === heading) continue;
              // Skip structural/SVG elements
              var shouldSkip = false;
              if (skipTags.indexOf(sib.tagName) > -1 && !sib.classList.contains('pp-hero__text')) {
                for (var sc = 0; sc < skipClasses.length; sc++) {
                  if (sib.classList.contains(skipClasses[sc])) { shouldSkip = true; break; }
                }
                if (sib.tagName === 'SVG') shouldSkip = true;
                if (sib.querySelector('svg') && !sib.classList.contains('pp-hero__text')) {
                  var isCarousel = sib.classList.contains('pp-carousel') || sib.querySelector('.pp-carousel');
                  if (isCarousel) shouldSkip = true;
                }
              }
              if (shouldSkip) continue;
              // Only animate text-like siblings: p, a, span, button
              var tag = sib.tagName;
              if (tag === 'P' || tag === 'A' || tag === 'SPAN' || tag === 'BUTTON' || sib.classList.contains('pp-hero__text')) {
                if (!sib.classList.contains('pp-reveal')) sib.classList.add('pp-reveal');
                setTimeout((function(el) {
                  return function() { el.classList.add('pp-visible'); };
                })(sib), delay);
                delay += 150;
              }
            }
          }
          wordObserver.unobserve(heading);
        }
      }
    }, { threshold: 0.2 });

    // --- Mark reveal elements with stagger delays ---
    function markReveal(sel, baseDelay) {
      var els = document.querySelectorAll(sel);
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.classList.contains('pp-reveal')) continue;
        el.classList.add('pp-reveal');
        if (typeof baseDelay === 'number') {
          el.style.transitionDelay = (baseDelay + i * 80) + 'ms';
        }
        observer.observe(el);
      }
    }

    // Cards — staggered within their containers
    var staggerGroups = [
      '.pp-category-grid > .pp-category-card',
      '.pp-promo-row > .pp-promo-card',
      '.pp-guide-grid > .pp-blog-card'
    ];
    staggerGroups.forEach(function(sel) {
      var els = document.querySelectorAll(sel);
      for (var i = 0; i < els.length; i++) {
        els[i].classList.add('pp-reveal');
        els[i].style.transitionDelay = (i * 80) + 'ms';
        observer.observe(els[i]);
      }
    });

    // Hero subtitle + button — will be triggered by heading word observer
    document.querySelectorAll('.pp-hero__text, .pp-hero .pp-btn').forEach(function(el) {
      el.classList.add('pp-reveal');
    });

    // Individual elements — subtitles, buttons, sections
    markReveal('.pp-featured-brand__content', 0);
    markReveal('.pp-featured-brand__text', 150);
    markReveal('.pp-featured-brand__content .pp-btn', 300);
    markReveal('.pp-new-arrival-row > .pp-promo-card', 0);
    markReveal('.pp-new-arrival-row__products', 150);
    markReveal('.pp-guide-header', 0);
    markReveal('.pp-guide-header p', 100);
    markReveal('.pp-pet-guide-section .pp-btn', 200);
    markReveal('.pp-footer__newsletter', 0);

    // --- Word-by-word blur-in headings ---
    var headingSels = [
      '.pp-hero__content .pp-h1',
      '.pp-category-wave__heading',
      '.pp-section-heading',
      '.pp-testimonials__heading',
      '.pp-featured-brand__content .pp-h1'
    ];

    headingSels.forEach(function(sel) {
      var headings = document.querySelectorAll(sel);
      for (var h = 0; h < headings.length; h++) {
        var heading = headings[h];
        if (heading.dataset.ppSplit) continue;
        heading.dataset.ppSplit = '1';

        var text = heading.textContent.trim();
        var words = text.split(/\s+/);
        heading.textContent = '';

        for (var w = 0; w < words.length; w++) {
          var span = document.createElement('span');
          span.className = 'pp-blur-word';
          span.textContent = words[w];
          span.style.transitionDelay = (w * 90) + 'ms';
          heading.appendChild(span);
          if (w < words.length - 1) heading.appendChild(document.createTextNode(' '));
        }

        wordObserver.observe(heading);
      }
    });
  }

  // Init animations after first paint + idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(initScrollAnimations, { timeout: 200 });
  } else {
    requestAnimationFrame(function() {
      requestAnimationFrame(initScrollAnimations);
    });
  }
})();
