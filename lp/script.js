/* =============================================================
   MISS MILÚ — Landing Page
   script.js
   ============================================================= */

/* === COMPOSICAO EDITORIAL DAS SECOES === */
(function () {
  var clientesContent = document.getElementById('clientes-content');
  var brandsHeading = document.querySelector('.hero-brands-heading');
  var brandsGrid = document.querySelector('.hero-logo-carousel');
  var produto = document.getElementById('produto');
  var facilidades = document.querySelector('.facilidades');

  if (clientesContent && brandsHeading && brandsGrid) {
    clientesContent.appendChild(brandsHeading);
    clientesContent.appendChild(brandsGrid);
  }

  if (produto && facilidades) {
    produto.insertAdjacentElement('afterend', facilidades);
  }
})();

/* === HERO: carrossel automatico de imagens === */
(function () {
  var carousel = document.querySelector('[data-hero-carousel]');
  if (!carousel) return;

  var firstSlide = carousel.querySelector('.hero-carousel-slide');
  var basePath = 'assets/hero-carrossel/';
  var extensions = ['webp', 'jpg', 'jpeg', 'png'];
  var startSlot = Number(carousel.getAttribute('data-hero-start')) || 1;
  var maxSlots = startSlot + 7;
  var slides = firstSlide ? [firstSlide] : [];
  var activeIndex = 0;
  var timer = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function formatSlot(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function probeImage(url) {
    return new Promise(function (resolve) {
      var probe = new Image();
      probe.onload = function () {
        resolve(url);
      };
      probe.onerror = function () {
        resolve(null);
      };
      probe.src = url;
    });
  }

  function findSlot(slot) {
    var extensionIndex = 0;

    function tryNext() {
      if (extensionIndex >= extensions.length) {
        return Promise.resolve(null);
      }

      var url = basePath + formatSlot(slot) + '.' + extensions[extensionIndex];
      extensionIndex += 1;

      return probeImage(url).then(function (result) {
        return result || tryNext();
      });
    }

    return tryNext();
  }

  function showNext() {
    if (slides.length < 2) return;

    slides[activeIndex].classList.remove('active');
    activeIndex = (activeIndex + 1) % slides.length;
    slides[activeIndex].classList.add('active');
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

  function appendSlide(path) {
    var image = document.createElement('img');
    image.className = 'hero-carousel-slide';
    image.src = path;
    image.alt = 'Projeto em destaque produzido pela Miss Milú';
    image.width = 1200;
    image.height = 1500;
    image.loading = 'eager';
    image.decoding = 'async';
    carousel.appendChild(image);
    slides.push(image);
  }

  function loadSlots(slot) {
    if (slot > maxSlots) {
      return Promise.resolve();
    }

    return findSlot(slot).then(function (path) {
      if (!path) {
        return;
      }

      appendSlide(path);
      return loadSlots(slot + 1);
    });
  }

  loadSlots(startSlot + 1).then(function () {
    startCarousel();
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




/* === PORTFOLIO: filtro + ver mais === */
(function () {
  var grid = document.getElementById('portfolio-grid');
  if (!grid || grid.hidden) return;

  var itens   = Array.prototype.slice.call(grid.querySelectorAll('.portfolio-item'));
  var filtros = Array.prototype.slice.call(document.querySelectorAll('[data-filtro]'));
  var btnMais = document.getElementById('portfolio-mais');
  var vazio   = document.getElementById('portfolio-vazio');
  var LOTE    = 16;

  var atual = 'todos';
  var expandido = false;

  function daCategoria(cat) {
    return cat === 'todos'
      ? itens
      : itens.filter(function (el) { return el.getAttribute('data-cat') === cat; });
  }

  function render() {
    var visiveis = daCategoria(atual);
    /* ao filtrar um segmento mostra ele inteiro; o "ver mais" so existe no Todos */
    var limite = (atual === 'todos' && !expandido) ? LOTE : visiveis.length;

    itens.forEach(function (el) { el.classList.add('is-hidden'); });
    visiveis.slice(0, limite).forEach(function (el) { el.classList.remove('is-hidden'); });

    if (btnMais) {
      btnMais.hidden = visiveis.length <= limite;
    }
    if (vazio) {
      vazio.hidden = visiveis.length !== 0;
    }
  }

  filtros.forEach(function (btn) {
    btn.addEventListener('click', function () {
      atual = btn.getAttribute('data-filtro');
      expandido = false;
      filtros.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
    });
  });

  if (btnMais) {
    btnMais.addEventListener('click', function () {
      expandido = true;
      render();
      btnMais.blur();
    });
  }

  render();
})();


/* === PORTFOLIO: lightbox === */
(function () {
  var caixa    = document.getElementById('lightbox');
  var img      = document.getElementById('lightbox-img');
  var legenda  = document.getElementById('lightbox-legenda');
  var btnFecha = document.getElementById('lightbox-fechar');
  var btnPrev  = document.getElementById('lightbox-prev');
  var btnNext  = document.getElementById('lightbox-next');
  var grid     = document.getElementById('portfolio-grid');
  if (!caixa || !img || !grid || grid.hidden) return;

  var indice = 0;

  function visiveis() {
    return Array.prototype.slice.call(
      grid.querySelectorAll('.portfolio-item:not(.is-hidden)')
    );
  }

  function mostrar(i) {
    var lista = visiveis();
    if (!lista.length) return;
    indice = (i + lista.length) % lista.length;

    var item = lista[indice];
    var foto = item.querySelector('img');
    var cap  = item.querySelector('figcaption');

    /* o lightbox nunca amplia alem do nativo: a origem e limitada */
    img.style.width = item.getAttribute('data-w') + 'px';
    img.src = item.getAttribute('data-full');
    img.alt = foto ? foto.alt : '';
    if (legenda) legenda.textContent = cap ? cap.textContent : '';

    var so = lista.length < 2;
    if (btnPrev) btnPrev.hidden = so;
    if (btnNext) btnNext.hidden = so;
  }

  function abrir(i) {
    mostrar(i);
    caixa.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (btnFecha) btnFecha.focus();
  }

  function fechar() {
    caixa.classList.remove('active');
    document.body.style.overflow = '';
    img.src = '';
  }

  grid.addEventListener('click', function (e) {
    var item = e.target.closest ? e.target.closest('.portfolio-item') : null;
    if (!item) return;
    var i = visiveis().indexOf(item);
    if (i >= 0) abrir(i);
  });

  if (btnFecha) btnFecha.addEventListener('click', fechar);
  if (btnPrev)  btnPrev.addEventListener('click', function () { mostrar(indice - 1); });
  if (btnNext)  btnNext.addEventListener('click', function () { mostrar(indice + 1); });

  caixa.addEventListener('click', function (e) {
    if (e.target === caixa) fechar();
  });

  document.addEventListener('keydown', function (e) {
    if (!caixa.classList.contains('active')) return;
    if (e.key === 'Escape')     fechar();
    if (e.key === 'ArrowLeft')  mostrar(indice - 1);
    if (e.key === 'ArrowRight') mostrar(indice + 1);
  });
})();


/* === PORTFOLIO EDITORIAL: segmentos, curadoria, carrossel e lightbox === */
(function () {
  var source = document.getElementById('portfolio-grid');
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

  var tones = ['#EEDDD6', '#DDE7EB', '#E5E1D2', '#DCE5DC', '#E8DDE4', '#E9DFD3'];
  var activeCategory = '01-corporativo';
  var activeIndex = 0;
  var lightboxIndex = 0;
  var activeSlides = [];
  var touchStartX = 0;

  var categories = {
    '01-corporativo': {
      title: 'Empresas e Corporativo',
      description: 'Brindes, press kits e gifts para RH, Marketing e Compras que representam a marca com qualidade.',
      picks: [
        ['01.jpg', 'cover'],
        ['02.jpg', 'cover'],
        ['03.jpg', 'cover'],
        ['04.jpg', 'cover'],
        ['05.jpg', 'cover'],
        ['06.jpg', 'cover']
      ]
    },
    '02-arquitetos': {
      title: 'Arquitetos',
      description: 'Caixas e kits de apresentação que valorizam projetos, materiais e entregas especiais de escritórios de arquitetura.',
      picks: [
        ['01.webp', 'contain'],
        ['02.webp', 'contain'],
        ['03.webp', 'cover'],
        ['04.webp', 'cover'],
        ['05.webp', 'cover'],
        ['06.webp', 'cover']
      ]
    },
    '03-confeitaria': {
      title: 'Chocolateria e Confeitaria Premium',
      description: 'Caixas que valorizam trufas, bombons e ovos de Páscoa de alta qualidade.',
      picks: [
        ['07.jpg', 'cover'],
        ['08.jpg', 'cover'],
        ['09.jpg', 'cover'],
        ['10.jpg', 'cover'],
        ['11.jpg', 'cover'],
        ['12.jpg', 'cover']
      ]
    },
    '04-cestas-e-cafe': {
      title: 'Cestas e Café da Manhã',
      description: 'Caixas tipo maleta para delivery de presentes e cafés da manhã especiais.',
      picks: [
        ['01.webp', 'cover'],
        ['02.webp', 'contain'],
        ['03.webp', 'cover'],
        ['04.webp', 'contain'],
        ['05.webp', 'contain'],
        ['06.webp', 'cover']
      ]
    },
    '05-fotografos': {
      title: 'Fotógrafos Profissionais',
      description: 'Box de entrega premium para álbuns, pendrive e material fotográfico de valor.',
      picks: [
        ['01.webp', 'cover'],
        ['02.webp', 'cover'],
        ['03.webp', 'contain'],
        ['04.webp', 'cover'],
        ['05.webp', 'contain']
      ]
    },
    '06-padrinhos': {
      title: 'Padrinhos',
      description: 'Caixas personalizadas para convites, lembranças e presentes que tornam esse momento ainda mais especial.',
      picks: [
        ['13.jpg', 'cover'],
        ['14.jpg', 'cover'],
        ['15.jpg', 'cover'],
        ['16.jpg', 'cover'],
        ['17.jpg', 'cover'],
        ['18.jpg', 'cover']
      ]
    },
    '07-velas-e-saboaria': {
      title: 'Saboaria e Velas',
      description: 'Embalagens artesanais para velas aromáticas, difusores e cosméticos naturais.',
      picks: [
        ['01.webp', 'cover'],
        ['02.webp', 'cover'],
        ['03.webp', 'cover'],
        ['04.webp', 'cover'],
        ['05.webp', 'cover'],
        ['06.webp', 'contain']
      ]
    },
    '08-casinhas': {
      title: 'Casinhas',
      description: 'Embalagens em formato de casinha criadas para apresentar produtos de forma afetiva, original e memorável.',
      picks: [
        ['19.jpg', 'cover'],
        ['20.jpg', 'cover'],
        ['21.jpg', 'cover'],
        ['22.jpg', 'cover'],
        ['23.jpg', 'cover'],
        ['24.jpg', 'cover']
      ]
    },
    '09-datas-sazonais': {
      title: 'Datas Sazonais',
      description: 'Projetos especiais para Páscoa, Natal e outras datas que pedem uma apresentação marcante.',
      picks: [
        ['01.webp', 'cover'],
        ['02.webp', 'cover'],
        ['03.webp', 'contain'],
        ['04.webp', 'contain'],
        ['05.webp', 'cover']
      ]
    }
  };

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

  function buildSlides(category) {
    var config = categories[category] || categories['01-corporativo'];
    activeCategory = category;
    var activeFilter = filters.find(function (filter) {
      return filter.getAttribute('data-filtro') === activeCategory;
    });
    var categoryLabel = activeFilter && activeFilter.childNodes.length
      ? activeFilter.childNodes[0].textContent.trim()
      : config.title;

    activeSlides = config.picks.map(function (pick) {
      return {
        category: activeCategory,
        file: pick[0],
        mode: pick[1],
        full: 'assets/portfolio-trocar/' + activeCategory + '/' + pick[0],
        alt: 'Caixa personalizada Miss Milú para ' + categoryLabel.toLowerCase(),
        caption: categoryLabel
      };
    }).slice(0, 6);

    title.textContent = config.title;
    description.textContent = config.description;
    totalLabel.textContent = formatNumber(activeSlides.length);
    track.innerHTML = '';
    dots.innerHTML = '';

    activeSlides.forEach(function (slide, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'portfolio-slide' + (slide.mode === 'contain' ? ' is-contained' : '');
      button.style.setProperty('--slide-tone', tones[index % tones.length]);
      button.setAttribute('aria-label', 'Ampliar projeto ' + slide.caption + ', imagem ' + (index + 1));

      var image = document.createElement('img');
      image.src = slide.full;
      image.alt = slide.alt;
      image.loading = index === 0 ? 'eager' : 'lazy';
      image.decoding = 'async';
      image.addEventListener('load', function () {
        var ratio = image.naturalWidth / image.naturalHeight;
        var isPreparedFormat = image.naturalWidth >= 1000 && Math.abs(ratio - 0.8) <= 0.025;

        if (isPreparedFormat) {
          button.classList.remove('is-contained');
        }
      });

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
    lightboxImg.src = slide.full;
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

  buildSlides(activeCategory);
})();
