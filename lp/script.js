/* =============================================================
   MISS MILÚ — Landing Page
   script.js
   ============================================================= */

/* === PORTFOLIO: catalogo automatico compartilhado === */
var missMiluPortfolio = (function () {
  var categoryMeta = {
    '01-corporativo': {
      label: 'Corporativo',
      title: 'Empresas e Corporativo',
      description: 'Brindes, press kits e gifts para RH, Marketing e Compras que representam a marca com qualidade.'
    },
    '02-arquitetos': {
      label: 'Arquitetos',
      title: 'Arquitetos',
      description: 'Caixas e kits de apresentação que valorizam projetos, materiais e entregas especiais de escritórios de arquitetura.'
    },
    '03-confeitaria': {
      label: 'Confeitaria',
      title: 'Chocolateria e Confeitaria Premium',
      description: 'Caixas que valorizam trufas, bombons e ovos de Páscoa de alta qualidade.'
    },
    '04-cestas-e-cafe': {
      label: 'Cestas e Café',
      title: 'Cestas e Café da Manhã',
      description: 'Caixas tipo maleta para delivery de presentes e cafés da manhã especiais.'
    },
    '05-fotografos': {
      label: 'Fotógrafos',
      title: 'Fotógrafos Profissionais',
      description: 'Box de entrega premium para álbuns, pendrive e material fotográfico de valor.'
    },
    '06-padrinhos': {
      label: 'Padrinhos',
      title: 'Padrinhos',
      description: 'Caixas personalizadas para convites, lembranças e presentes que tornam esse momento ainda mais especial.'
    },
    '07-velas-e-saboaria': {
      label: 'Velas e Saboaria',
      title: 'Saboaria e Velas',
      description: 'Caixas artesanais para velas aromáticas, difusores e cosméticos naturais.'
    },
    '08-casinhas': {
      label: 'Casinhas',
      title: 'Casinhas',
      description: 'Caixas em formato de casinha criadas para apresentar produtos de forma afetiva, original e memorável.'
    },
    '09-datas-sazonais': {
      label: 'Datas Sazonais',
      title: 'Datas Sazonais',
      description: 'Projetos especiais para Páscoa, Natal e outras datas que pedem uma apresentação marcante.'
    }
  };

  var categoryOrder = Object.keys(categoryMeta);
  var fallbackCatalog = window.MISS_MILU_PORTFOLIO_CATALOG;

  function normalizeCatalog(catalog) {
    if (!catalog || typeof catalog !== 'object' || !catalog.categories) {
      throw new Error('Catalogo do portfolio invalido.');
    }

    var normalizedCategories = {};
    var total = 0;

    categoryOrder.forEach(function (categoryId) {
      var images = Array.isArray(catalog.categories[categoryId])
        ? catalog.categories[categoryId]
        : [];

      normalizedCategories[categoryId] = images.filter(function (image) {
        return image && typeof image.src === 'string' && image.src.length > 0;
      });
      total += normalizedCategories[categoryId].length;
    });

    return {
      version: catalog.version || '',
      total: total,
      categories: normalizedCategories,
      errors: Array.isArray(catalog.errors) ? catalog.errors : []
    };
  }

  function loadCatalog() {
    return Promise.resolve().then(function () {
      return normalizeCatalog(fallbackCatalog);
    });
  }

  return {
    meta: categoryMeta,
    order: categoryOrder,
    ready: loadCatalog()
  };
})();

/* === HERO: ate cinco imagens aleatorias do portfolio === */
(function () {
  var carousel = document.querySelector('[data-hero-carousel]');
  if (!carousel) return;

  var fallbackSlide = carousel.querySelector('.hero-carousel-slide');
  var slides = fallbackSlide ? [fallbackSlide] : [];
  var activeIndex = 0;
  var timer = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var heroLimit = 5;

  function randomUnit() {
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      var randomValue = new Uint32Array(1);
      window.crypto.getRandomValues(randomValue);
      return randomValue[0] / 4294967296;
    }
    return Math.random();
  }

  function shuffle(items) {
    var shuffled = items.slice();
    for (var index = shuffled.length - 1; index > 0; index -= 1) {
      var randomIndex = Math.floor(randomUnit() * (index + 1));
      var current = shuffled[index];
      shuffled[index] = shuffled[randomIndex];
      shuffled[randomIndex] = current;
    }
    return shuffled;
  }

  function activateSlide(index) {
    if (!slides.length) return;
    activeIndex = (index + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      var active = slideIndex === activeIndex;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
  }

  function showNext() {
    if (slides.length < 2) return;
    activateSlide(activeIndex + 1);
  }

  function stopCarousel() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function startCarousel() {
    stopCarousel();
    if (slides.length > 1 && !reducedMotion.matches && !document.hidden) {
      timer = window.setInterval(showNext, 2000);
    }
  }

  function removeBrokenSlide(image) {
    var failedIndex = slides.indexOf(image);
    if (failedIndex < 0) return;

    image.remove();
    slides.splice(failedIndex, 1);
    activateSlide(Math.min(activeIndex, slides.length - 1));
    startCarousel();
  }

  function createSlide(photo, index) {
    var category = missMiluPortfolio.meta[photo.category];
    var image = document.createElement('img');
    image.className = 'hero-carousel-slide';
    image.src = photo.src;
    image.alt = 'Projeto de ' + (category ? category.label.toLowerCase() : 'caixa personalizada') + ' produzido pela Miss Milú';
    image.width = photo.width || 1200;
    image.height = photo.height || 1500;
    image.loading = index === 0 ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
    if (index === 0) {
      image.fetchPriority = 'high';
    }
    image.addEventListener('error', function () {
      removeBrokenSlide(image);
    });
    return image;
  }

  function waitForFirstImage(image) {
    if (image.complete) {
      return Promise.resolve(image.naturalWidth > 0);
    }

    return new Promise(function (resolve) {
      image.addEventListener('load', function () { resolve(true); }, { once: true });
      image.addEventListener('error', function () { resolve(false); }, { once: true });
    });
  }

  function buildHeroPool(catalog) {
    var pool = [];
    missMiluPortfolio.order.forEach(function (categoryId) {
      catalog.categories[categoryId].forEach(function (photo) {
        pool.push({
          category: categoryId,
          src: photo.src,
          width: photo.width,
          height: photo.height
        });
      });
    });
    return shuffle(pool);
  }

  function renderHero(pool) {
    var selection = pool.slice(0, Math.min(heroLimit, pool.length));
    if (!selection.length) {
      carousel.setAttribute('aria-busy', 'false');
      return;
    }

    var nextSlides = selection.map(createSlide);

    waitForFirstImage(nextSlides[0]).then(function (loaded) {
      if (!loaded) {
        renderHero(pool.slice(1));
        return;
      }

      stopCarousel();
      carousel.innerHTML = '';
      nextSlides.forEach(function (slide) {
        carousel.appendChild(slide);
      });
      slides = nextSlides;
      activeIndex = 0;
      activateSlide(0);
      carousel.setAttribute('aria-busy', 'false');
      startCarousel();
    });
  }

  carousel.setAttribute('aria-busy', 'true');
  missMiluPortfolio.ready.then(function (catalog) {
    renderHero(buildHeroPool(catalog));
  }).catch(function () {
    carousel.setAttribute('aria-busy', 'false');
  });

  document.addEventListener('visibilitychange', startCarousel);

  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', startCarousel);
  }
})();

/* === HEADER: sombra no scroll === */
(function () {
  const header = document.getElementById('header');
  if (!header) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
})();


/* === WHATSAPP FLUTUANTE NO MOBILE === */
(function () {
  const update = function () {
    const form = document.getElementById('formulario');
    const formRect = form ? form.getBoundingClientRect() : null;
    const formVisible = formRect ? formRect.top < window.innerHeight && formRect.bottom > 0 : false;
    const shouldShow = window.innerWidth > 768 || (window.scrollY > 640 && !formVisible);
    document.body.classList.toggle('show-floating-whatsapp', shouldShow);
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
})();


/* === FAQ: accordion === */
(function () {
  const items = document.querySelectorAll('.faq-item');

  items.forEach(function (item) {
    const question = item.querySelector('.faq-question');
    if (!question) return;
    question.setAttribute('aria-expanded', 'false');

    question.addEventListener('click', function () {
      const isOpen = item.classList.contains('open');

      /* Fecha todos */
      items.forEach(function (i) {
        i.classList.remove('open');
        var trigger = i.querySelector('.faq-question');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });

      /* Abre o clicado (se estava fechado) */
      if (!isOpen) {
        item.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();


/* === MASCARA DE TELEFONE (WhatsApp) === */
(function () {
  const input = document.getElementById('whatsapp');
  if (!input) return;

  input.addEventListener('input', function () {
    let v = input.value.replace(/\D/g, '').substring(0, 11);
    if (v.length > 6) {
      v = '(' + v.substring(0, 2) + ') ' + v.substring(2, 7) + '-' + v.substring(7);
    } else if (v.length > 2) {
      v = '(' + v.substring(0, 2) + ') ' + v.substring(2);
    } else if (v.length > 0) {
      v = '(' + v;
    }
    input.value = v;
  });
})();


/* === FORMULARIO: envia para WhatsApp === */
(function () {
  const form = document.getElementById('orcamento-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const nome      = (document.getElementById('nome').value      || '').trim();
    const empresa   = (document.getElementById('empresa').value   || '').trim();
    const whatsapp  = (document.getElementById('whatsapp').value  || '').trim();
    const segmento  = (document.getElementById('segmento').value  || '').trim();
    const quantidade= (document.getElementById('quantidade').value|| '').trim();
    const descricao = (document.getElementById('descricao').value || '').trim();

    /* Validacao basica */
    if (!nome || !empresa || !whatsapp || !segmento || !quantidade) {
      alert('Por favor, preencha todos os campos obrigatorios.');
      return;
    }

    const linhas = [
      'Ola! Tenho interesse em um orcamento da Miss Milu.',
      '',
      'Nome: ' + nome,
      'Empresa: ' + empresa,
      'WhatsApp: ' + whatsapp,
      'Segmento: ' + segmento,
      'Quantidade estimada: ' + quantidade,
    ];

    if (descricao) {
      linhas.push('');
      linhas.push('Sobre o projeto: ' + descricao);
    }

    const mensagem = linhas.join('\n');
    const url = 'https://wa.me/5511981628872?text=' + encodeURIComponent(mensagem);

    window.open(url, '_blank', 'noopener');
  });
})();


/* === CAROUSEL: avaliacoes === */
(function () {
  var carousel = document.querySelector('[data-review-carousel]');
  if (!carousel) return;

  var cards = Array.prototype.slice.call(carousel.querySelectorAll('.review-card'));
  var buttonPrev = carousel.querySelector('[data-review-prev]');
  var buttonNext = carousel.querySelector('[data-review-next]');
  var currentLabel = carousel.querySelector('[data-review-current]');
  var totalLabel = carousel.querySelector('[data-review-total]');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var activeIndex = 0;
  var timer = null;
  var interval = 7000;

  if (!cards.length || !buttonPrev || !buttonNext) return;

  if (totalLabel) {
    totalLabel.textContent = String(cards.length).padStart(2, '0');
  }

  function show(index) {
    activeIndex = (index + cards.length) % cards.length;

    cards.forEach(function (card, cardIndex) {
      var isActive = cardIndex === activeIndex;
      card.classList.toggle('active', isActive);
      card.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    if (currentLabel) {
      currentLabel.textContent = String(activeIndex + 1).padStart(2, '0');
    }
  }

  function stop() {
    if (!timer) return;
    window.clearInterval(timer);
    timer = null;
  }

  function start() {
    stop();
    if (reduceMotion || document.hidden) return;

    timer = window.setInterval(function () {
      show(activeIndex + 1);
    }, interval);
  }

  function changeBy(step) {
    show(activeIndex + step);
    start();
  }

  buttonPrev.addEventListener('click', function () {
    changeBy(-1);
  });

  buttonNext.addEventListener('click', function () {
    changeBy(1);
  });

  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', function (event) {
    if (!carousel.contains(event.relatedTarget)) start();
  });

  carousel.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      changeBy(-1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      changeBy(1);
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  show(0);
  start();
})();


/* === HERO: movimento dos cards === */
(function () {
  var cards = document.querySelectorAll('.hero-photo-card');
  if (!cards.length) return;

  cards.forEach(function (card) {
    function activate() {
      card.classList.add('is-hovered');
    }

    function deactivate() {
      card.classList.remove('is-hovered');
    }

    card.addEventListener('mouseenter', activate);
    card.addEventListener('pointerenter', activate);
    card.addEventListener('mouseleave', deactivate);
    card.addEventListener('pointerleave', deactivate);
  });
})();


/* === MODAL: AVALIAÇÕES === */
(function () {
  var overlay  = document.getElementById('modal-avaliacoes');
  var btnOpen  = document.getElementById('btn-avaliacoes');
  var btnClose = document.getElementById('modal-close');
  if (!overlay || !btnOpen) return;

  function open() {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  btnOpen.addEventListener('click', open);
  btnClose.addEventListener('click', close);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) close();
  });
})();


/* === ANIMACAO SUAVE AO ENTRAR NA VIEWPORT === */
(function () {
  if (!('IntersectionObserver' in window)) return;

  const style = document.createElement('style');
  style.textContent = [
    '.fade-in { opacity: 0; transform: translateY(28px); transition: opacity 0.72s ease, transform 0.72s ease, box-shadow 0.28s ease, border-color 0.28s ease; }',
    '.fade-in.visible { opacity: 1; transform: translateY(0); }',
  ].join('');
  document.head.appendChild(style);

  const targets = document.querySelectorAll(
    '.hero-content, .hero-editorial-visual, .hero-brands-heading, .hero-logo-item, .facilidade-item, .produto-visual, .produto-card, .autoria-visual, .autoria-conteudo, .portfolio-segment-copy, .portfolio-carousel, .step, .review-panel'
  );

  const sections = document.querySelectorAll(
    '.clientes, .facilidades, .produto, .autoria, .portfolio, .processo, .avaliacoes, .faq, .formulario'
  );

  targets.forEach(function (el, index) {
    el.classList.add('fade-in');
    el.style.transitionDelay = Math.min(index % 3, 2) * 70 + 'ms';
  });

  sections.forEach(function (section) {
    section.classList.add('section-reveal');
  });

  function revealVisible() {
    targets.forEach(function (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.1 && rect.bottom > -80) {
        el.classList.add('visible');
        el.style.transitionDelay = '';
      }
    });

    sections.forEach(function (section) {
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        section.classList.add('section-visible');
      }
    });
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        if (entry.target.classList.contains('section-reveal')) {
          entry.target.classList.add('section-visible');
        } else {
          entry.target.classList.add('visible');
        }
        entry.target.style.transitionDelay = '';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(function (el) { observer.observe(el); });
  sections.forEach(function (section) { observer.observe(section); });
  revealVisible();
  window.addEventListener('scroll', revealVisible, { passive: true });
  window.addEventListener('resize', revealVisible);
  window.setTimeout(revealVisible, 450);
  window.setTimeout(function () {
    targets.forEach(function (el) {
      el.classList.add('visible');
      el.style.transitionDelay = '';
    });
    sections.forEach(function (section) {
      section.classList.add('section-visible');
    });
  }, 1000);
})();





/* === PORTFOLIO EDITORIAL: segmentos, curadoria, carrossel e lightbox === */
(function () {
  var track = document.getElementById('portfolio-carousel-track');
  var dots = document.getElementById('portfolio-carousel-dots');
  var title = document.getElementById('portfolio-segment-title');
  var description = document.getElementById('portfolio-segment-description');
  var currentLabel = document.getElementById('portfolio-current');
  var totalLabel = document.getElementById('portfolio-total');
  var carousel = document.querySelector('.portfolio-carousel');
  var viewport = document.querySelector('.portfolio-carousel-viewport');
  var carouselPrev = document.querySelector('.portfolio-carousel-prev');
  var carouselNext = document.querySelector('.portfolio-carousel-next');
  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-filtro]'));

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxCaption = document.getElementById('lightbox-legenda');
  var lightboxClose = document.getElementById('lightbox-fechar');
  var lightboxPrev = document.getElementById('lightbox-prev');
  var lightboxNext = document.getElementById('lightbox-next');

  if (!track || !carousel || !lightbox || !lightboxImg) return;

  var tones = ['#F4DDD1', '#F1D9CE', '#F6E1D5', '#EFD7CB', '#F3DCD0', '#F7E3D8'];
  var activeCategory = '01-corporativo';
  var activeIndex = 0;
  var lightboxIndex = 0;
  var activeSlides = [];
  var touchStartX = 0;
  var catalogCategories = {};
  var failedSources = {};

  function formatNumber(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function showSlide(index) {
    if (!activeSlides.length) return;
    activeIndex = (index + activeSlides.length) % activeSlides.length;
    track.style.transform = 'translate3d(-' + (activeIndex * 100) + '%, 0, 0)';
    currentLabel.textContent = formatNumber(activeIndex + 1);

    Array.prototype.forEach.call(dots.children, function (dot, dotIndex) {
      var active = dotIndex === activeIndex;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    Array.prototype.forEach.call(track.children, function (slide, slideIndex) {
      slide.setAttribute('aria-hidden', slideIndex === activeIndex ? 'false' : 'true');
      slide.tabIndex = slideIndex === activeIndex ? 0 : -1;
    });
  }

  function openLightbox(index) {
    showLightbox(index);
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (lightboxClose) lightboxClose.focus();
  }

  function updateFilterCounts() {
    filters.forEach(function (filter) {
      var categoryId = filter.getAttribute('data-filtro');
      var config = missMiluPortfolio.meta[categoryId];
      var count = (catalogCategories[categoryId] || []).filter(function (photo) {
        return !failedSources[photo.src];
      }).length;
      var countLabel = filter.querySelector('.portfolio-filtro-count');

      if (!countLabel) {
        countLabel = document.createElement('span');
        countLabel.className = 'portfolio-filtro-count';
        countLabel.setAttribute('aria-hidden', 'true');
        filter.appendChild(countLabel);
      }

      countLabel.textContent = formatNumber(count);
      if (config) {
        filter.setAttribute('aria-label', config.label + ': ' + count + ' projetos');
      }
    });
  }

  function renderEmptyState() {
    var empty = document.createElement('div');
    empty.className = 'portfolio-slide portfolio-slide-empty';
    empty.setAttribute('aria-hidden', 'false');
    empty.textContent = 'Nenhuma imagem disponível neste segmento.';
    track.appendChild(empty);
    currentLabel.textContent = '00';
    carouselPrev.hidden = true;
    carouselNext.hidden = true;
  }

  function buildSlides(category) {
    var defaultCategory = missMiluPortfolio.order[0];
    var config = missMiluPortfolio.meta[category] || missMiluPortfolio.meta[defaultCategory];
    activeCategory = missMiluPortfolio.meta[category] ? category : defaultCategory;
    activeIndex = 0;

    activeSlides = (catalogCategories[activeCategory] || []).filter(function (photo) {
      return !failedSources[photo.src];
    }).map(function (photo) {
      return {
        src: photo.src,
        width: photo.width,
        height: photo.height,
        alt: 'Caixa personalizada Miss Milú para ' + config.label.toLowerCase(),
        caption: config.label
      };
    });

    title.textContent = config.title;
    description.textContent = config.description;
    totalLabel.textContent = formatNumber(activeSlides.length);
    track.innerHTML = '';
    dots.innerHTML = '';
    track.style.transform = 'translate3d(0, 0, 0)';

    if (!activeSlides.length) {
      renderEmptyState();
      return;
    }

    activeSlides.forEach(function (slide, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'portfolio-slide';
      button.style.setProperty('--slide-tone', tones[index % tones.length]);
      button.setAttribute('aria-label', 'Ampliar projeto ' + slide.caption + ', imagem ' + (index + 1));

      var image = document.createElement('img');
      image.alt = slide.alt;
      image.width = slide.width || 1200;
      image.height = slide.height || 1500;
      image.loading = index === 0 ? 'eager' : 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', function () {
        failedSources[slide.src] = true;
        updateFilterCounts();
        buildSlides(activeCategory);
      });
      image.src = slide.src;

      var label = document.createElement('span');
      label.className = 'portfolio-slide-label';
      label.textContent = slide.caption;

      button.appendChild(image);
      button.appendChild(label);
      button.addEventListener('click', function () {
        openLightbox(index);
      });
      track.appendChild(button);

      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'portfolio-carousel-dot';
      dot.setAttribute('aria-label', 'Mostrar imagem ' + (index + 1));
      dot.addEventListener('click', function () {
        showSlide(index);
      });
      dots.appendChild(dot);
    });

    carouselPrev.hidden = activeSlides.length < 2;
    carouselNext.hidden = activeSlides.length < 2;
    showSlide(0);
  }

  function showLightbox(index) {
    if (!activeSlides.length) return;
    lightboxIndex = (index + activeSlides.length) % activeSlides.length;
    var slide = activeSlides[lightboxIndex];

    lightboxImg.style.removeProperty('width');
    lightboxImg.src = slide.src;
    lightboxImg.alt = slide.alt;
    if (lightboxCaption) lightboxCaption.textContent = slide.caption;

    var single = activeSlides.length < 2;
    if (lightboxPrev) lightboxPrev.hidden = single;
    if (lightboxNext) lightboxNext.hidden = single;
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  }

  filters.forEach(function (filter) {
    filter.disabled = true;
    filter.addEventListener('click', function () {
      var category = filter.getAttribute('data-filtro');
      filters.forEach(function (button) {
        var active = button === filter;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      buildSlides(category);
    });
  });

  carouselPrev.addEventListener('click', function () {
    showSlide(activeIndex - 1);
  });

  carouselNext.addEventListener('click', function () {
    showSlide(activeIndex + 1);
  });

  viewport.addEventListener('touchstart', function (event) {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  viewport.addEventListener('touchend', function (event) {
    var distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) < 45) return;
    showSlide(distance > 0 ? activeIndex - 1 : activeIndex + 1);
  }, { passive: true });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', function () { showLightbox(lightboxIndex - 1); });
  if (lightboxNext) lightboxNext.addEventListener('click', function () { showLightbox(lightboxIndex + 1); });

  lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (event) {
    if (!lightbox.classList.contains('active')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') showLightbox(lightboxIndex - 1);
    if (event.key === 'ArrowRight') showLightbox(lightboxIndex + 1);
  });

  carousel.setAttribute('aria-busy', 'true');
  missMiluPortfolio.ready.then(function (catalog) {
    catalogCategories = catalog.categories;
    updateFilterCounts();
    filters.forEach(function (filter) {
      filter.disabled = false;
    });
    buildSlides(activeCategory);
    carousel.setAttribute('aria-busy', 'false');

    if (catalog.errors.length && window.console && typeof window.console.warn === 'function') {
      window.console.warn('Avisos do catálogo do portfólio:', catalog.errors);
    }
  }).catch(function (error) {
    updateFilterCounts();
    filters.forEach(function (filter) {
      filter.disabled = false;
    });
    buildSlides(activeCategory);
    carousel.setAttribute('aria-busy', 'false');

    if (window.console && typeof window.console.error === 'function') {
      window.console.error(error);
    }
  });
})();
