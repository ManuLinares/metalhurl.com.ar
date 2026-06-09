document.addEventListener('DOMContentLoaded', () => {
	// 1. Scroll Effect for Header (Optimized using IntersectionObserver)
	const header = document.querySelector('.main-header');
	const scrollSentinel = document.createElement('div');
	scrollSentinel.style.position = 'absolute';
	scrollSentinel.style.top = '50px';
	scrollSentinel.style.left = '0';
	scrollSentinel.style.width = '1px';
	scrollSentinel.style.height = '1px';
	scrollSentinel.style.pointerEvents = 'none';
	document.body.prepend(scrollSentinel);

	const headerObserver = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (!entry.isIntersecting) {
				header.classList.add('scrolled');
			} else {
				header.classList.remove('scrolled');
			}
		});
	}, { root: null, threshold: 0 });

	headerObserver.observe(scrollSentinel);

	// 2. Mobile Menu Toggle & Event Delegation
	const menuToggle = document.querySelector('.menu-toggle');
	const mainNav = document.querySelector('.main-nav');
	const navLinks = document.querySelectorAll('.nav-link');

	menuToggle.addEventListener('click', () => {
		menuToggle.classList.toggle('active');
		mainNav.classList.toggle('active');
	});

	// Closes menu using event delegation on the nav container
	mainNav.addEventListener('click', (e) => {
		if (e.target.classList.contains('nav-link')) {
			menuToggle.classList.remove('active');
			mainNav.classList.remove('active');
		}
	});

	// 3. Hero Slideshow Background Animation
	const heroSlides = document.querySelectorAll('.hero-slide');
	let currentHeroSlide = 0;

	function nextHeroSlide() {
		heroSlides[currentHeroSlide].classList.remove('active');
		currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;
		heroSlides[currentHeroSlide].classList.add('active');
	}

	if (heroSlides.length > 1) {
		setInterval(nextHeroSlide, 5000);
	}

	// 4. About Us Facility Slideshow
	const aboutSlides = document.querySelectorAll('.about-slide');
	const aboutDots = document.querySelectorAll('.about-dot');
	let currentAboutSlide = 0;
	let aboutInterval;

	function showAboutSlide(index) {
		aboutSlides[currentAboutSlide].classList.remove('active');
		aboutDots[currentAboutSlide].classList.remove('active');

		currentAboutSlide = index;

		aboutSlides[currentAboutSlide].classList.add('active');
		aboutDots[currentAboutSlide].classList.add('active');
	}

	function startAboutSlider() {
		aboutInterval = setInterval(() => {
			let nextIndex = (currentAboutSlide + 1) % aboutSlides.length;
			showAboutSlide(nextIndex);
		}, 4000);
	}

	aboutDots.forEach((dot, idx) => {
		dot.addEventListener('click', () => {
			clearInterval(aboutInterval);
			showAboutSlide(idx);
			startAboutSlider();
		});
	});

	if (aboutSlides.length > 0) {
		startAboutSlider();
	}

	// 5. Dynamic Slideshow Gallery Config
	const galleriesConfig = {
		'horno-doble': { count: 14, prefix: 'horno-doble', title: 'Bisagra Horno Doble Brazo - Modelo' },
		'horno-suave': { count: 4,  prefix: 'horno-suave', title: 'Bisagra Horno Cierre Suave - Modelo' },
		'parrilla':    { count: 6,  prefix: 'parrilla',    title: 'Bisagra para Parrilla - Modelo' },
		'manijas':     { count: 23, prefix: 'manija',      title: 'Manija para Cocina - Modelo' },
		'barrales':    { count: 3,  prefix: 'barral',      title: 'Barral de Cocina - Modelo' },
		'amedida':     { count: 14, prefix: 'amedida',     title: 'Pieza a Medida Torno CNC - Detalle' }
	};

	const galleriesData = {};
	Object.entries(galleriesConfig).forEach(([key, cfg]) => {
		galleriesData[key] = Array.from({ length: cfg.count }, (_, i) => ({
			src: `assets/images/products/${key}/${cfg.prefix}_${i + 1}.jpg`,
			title: `${cfg.title} ${i + 1}`,
			category: key
		}));
	});

	const slideshowStates = {};

	// Render Carousels
	function initCarousels() {
		Object.keys(galleriesData).forEach(galleryKey => {
			const track = document.getElementById(`carousel-${galleryKey}`);
			const dotsContainer = document.getElementById(`dots-${galleryKey}`);
			const items = galleriesData[galleryKey];

			if (!track) return;

			track.innerHTML = items.map((item, idx) => `
				<div class="product-carousel-item ${idx === 0 ? 'active' : ''}" data-gallery="${galleryKey}" data-index="${idx}">
					<img src="${item.src}" alt="${item.title}" loading="lazy">
				</div>
			`).join('');

			if (dotsContainer) {
				dotsContainer.innerHTML = items.map((_, idx) => `
					<button class="carousel-dot ${idx === 0 ? 'active' : ''}" data-gallery="${galleryKey}" data-goto="${idx}"></button>
				`).join('');
			}

			slideshowStates[galleryKey] = {
				currentIndex: 0,
				intervalId: null
			};
		});

		// Consolidated click delegation
		document.addEventListener('click', (e) => {
			const dot = e.target.closest('.carousel-dot');
			if (dot) {
				const galleryKey = dot.getAttribute('data-gallery');
				const targetIdx = parseInt(dot.getAttribute('data-goto'));
				goToSlide(galleryKey, targetIdx);
				resetSlideshowTimer(galleryKey);
				return;
			}

			const carouselItem = e.target.closest('.product-carousel-item');
			if (carouselItem) {
				const galleryKey = carouselItem.getAttribute('data-gallery');
				const idx = parseInt(carouselItem.getAttribute('data-index'));
				openLightbox(galleryKey, idx);
			}
		});

		// Viewport-aware autoplay execution
		initAutoplayObserver();
	}

	function showSlide(galleryKey, index) {
		const track = document.getElementById(`carousel-${galleryKey}`);
		if (!track) return;

		const items = track.querySelectorAll('.product-carousel-item');
		const dotsContainer = document.getElementById(`dots-${galleryKey}`);
		const dots = dotsContainer ? dotsContainer.querySelectorAll('.carousel-dot') : [];

		items.forEach((item, idx) => {
			item.classList.toggle('active', idx === index);
		});

		dots.forEach((dot, idx) => {
			dot.classList.toggle('active', idx === index);
		});

		slideshowStates[galleryKey].currentIndex = index;
	}

	function goToSlide(galleryKey, index) {
		showSlide(galleryKey, index);
	}

	function nextSlide(galleryKey) {
		const total = galleriesData[galleryKey].length;
		const nextIdx = (slideshowStates[galleryKey].currentIndex + 1) % total;
		showSlide(galleryKey, nextIdx);
	}

	function startSlideshow(galleryKey) {
		if (slideshowStates[galleryKey].intervalId) return; // Already running

		const speed = 1500;
		slideshowStates[galleryKey].intervalId = setInterval(() => {
			nextSlide(galleryKey);
		}, speed);
	}

	function stopSlideshow(galleryKey) {
		if (slideshowStates[galleryKey].intervalId) {
			clearInterval(slideshowStates[galleryKey].intervalId);
			slideshowStates[galleryKey].intervalId = null;
		}
	}

	function resetSlideshowTimer(galleryKey) {
		stopSlideshow(galleryKey);
		startSlideshow(galleryKey);
	}

	// Dynamic Pause/Play based on viewport visibility
	function initAutoplayObserver() {
		const observerOptions = { root: null, threshold: 0.15 };

		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				const container = entry.target;
				const galleryKey = container.getAttribute('data-carousel');
				
				if (entry.isIntersecting) {
					startSlideshow(galleryKey);
				} else {
					stopSlideshow(galleryKey);
				}
			});
		}, observerOptions);

		document.querySelectorAll('.product-carousel-container').forEach(el => {
			observer.observe(el);
		});
	}

	initCarousels();

	// Lightbox Logic
	const lightbox = document.getElementById('lightbox');
	const lightboxImg = lightbox.querySelector('.lightbox-img');
	const lightboxClose = lightbox.querySelector('.lightbox-close');
	const lightboxPrev = lightbox.querySelector('.lightbox-btn.prev');
	const lightboxNext = lightbox.querySelector('.lightbox-btn.next');

	let activeGalleryKey = null;
	let activeImageIndex = 0;

	function openLightbox(galleryKey, index) {
		activeGalleryKey = galleryKey;
		activeImageIndex = parseInt(index);
		updateLightboxImage();
		lightbox.classList.add('active');
		document.body.style.overflow = 'hidden';
	}

	function closeLightbox() {
		lightbox.classList.remove('active');
		document.body.style.overflow = 'auto';
	}

	function updateLightboxImage() {
		const item = galleriesData[activeGalleryKey][activeImageIndex];
		if (item) {
			lightboxImg.src = item.src;
			lightboxImg.alt = item.title;
		}
	}

	function prevImage() {
		const total = galleriesData[activeGalleryKey].length;
		activeImageIndex = (activeImageIndex - 1 + total) % total;
		updateLightboxImage();
	}

	function nextImage() {
		const total = galleriesData[activeGalleryKey].length;
		activeImageIndex = (activeImageIndex + 1) % total;
		updateLightboxImage();
	}

	lightboxClose.addEventListener('click', closeLightbox);
	lightboxPrev.addEventListener('click', prevImage);
	lightboxNext.addEventListener('click', nextImage);

	lightbox.addEventListener('click', (e) => {
		if (e.target === lightbox) {
			closeLightbox();
		}
	});

	document.addEventListener('keydown', (e) => {
		if (!lightbox.classList.contains('active')) return;
		if (e.key === 'Escape') closeLightbox();
		if (e.key === 'ArrowLeft') prevImage();
		if (e.key === 'ArrowRight') nextImage();
	});

	// 6. Navigation Highlight (Intersection Observer)
	const sections = document.querySelectorAll('section[id]');
	const observerOptions = {
		root: null,
		rootMargin: '-30% 0px -60% 0px',
		threshold: 0
	};

	const sectionObserver = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const id = entry.target.getAttribute('id');
				navLinks.forEach(link => {
					link.classList.toggle('active', link.getAttribute('href').endsWith('#' + id));
				});
			}
		});
	}, observerOptions);

	sections.forEach(sec => sectionObserver.observe(sec));
});