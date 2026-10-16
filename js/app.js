document.addEventListener('DOMContentLoaded', () => {
  let allProjects = [];
  let appConfig = {
    profile_image: '',
    social_links: {
      telegram: 'https://t.me/',
      whatsapp: 'https://wa.me/',
      instagram: 'https://instagram.com/',
      facebook: 'https://facebook.com/',
      twitter: 'https://twitter.com/',
      tiktok: 'https://tiktok.com/'
    },
    youtube_channels: [
      { title: 'Main Tech Channel', url: 'https://youtube.com/' }
    ]
  };
  let currentView = 'about';
  let activeCategory = 'all';
  let activeStatus = 'all';
  let activeShopCategory = 'all';
  let filterNegotiableOnly = false;
  let searchQuery = '';

  // Pagination settings (30 cards per page)
  const ITEMS_PER_PAGE = 30;
  let currentProjectsPage = 1;
  let currentShopPage = 1;

  // Views
  const viewAbout = document.getElementById('view-about');
  const viewProjects = document.getElementById('view-projects');
  const viewShop = document.getElementById('view-shop');

  // Controls
  const projectsGrid = document.getElementById('projects-grid');
  const shopGrid = document.getElementById('shop-grid');
  const projectsPagination = document.getElementById('projects-pagination');
  const shopPagination = document.getElementById('shop-pagination');
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const refreshBtn = document.getElementById('refresh-btn');
  const navItems = document.querySelectorAll('.nav-item');
  const projectCount = document.getElementById('project-count');
  const categoryTitle = document.getElementById('current-category-title');
  const btnSwitchProjects = document.getElementById('btn-switch-projects');
  const btnHeroShop = document.getElementById('btn-hero-shop');
  const shopTotalCount = document.getElementById('shop-total-count');
  const shopCategoryFilters = document.querySelectorAll('#shop-category-filters .shop-pill-btn');
  const checkFilterNegotiable = document.getElementById('filter-negotiable-only');

  // KPI counters
  const statTotal = document.getElementById('stat-total');
  const statInProgress = document.getElementById('stat-inprogress');
  const statCompleted = document.getElementById('stat-completed');

  // Project Details Modal elements
  const modal = document.getElementById('project-modal');
  const modalClose = document.getElementById('modal-close');
  const modalTags = document.getElementById('modal-tags');
  const modalTitle = document.getElementById('modal-title');
  const modalDescription = document.getElementById('modal-description');
  const modalLink = document.getElementById('modal-link');
  const modalCatChip = document.getElementById('modal-cat-chip');
  const modalStatusChip = document.getElementById('modal-status-chip');
  const specCategory = document.getElementById('spec-category');
  const specStatus = document.getElementById('spec-status');
  const specAssetsCount = document.getElementById('spec-assets-count');
  const specLinkRow = document.getElementById('spec-link-row');
  const specLinkText = document.getElementById('spec-link-text');
  const modalCopyLinkBtn = document.getElementById('modal-copy-link-btn');

  // Modal Slider Elements
  const modalSliderImg = document.getElementById('modal-slider-img');
  const modalSliderPrev = document.getElementById('modal-slider-prev');
  const modalSliderNext = document.getElementById('modal-slider-next');
  const modalSliderCounter = document.getElementById('modal-slider-counter');
  const modalSliderThumbs = document.getElementById('modal-slider-thumbs');
  const modalSliderStage = document.querySelector('.modal-slider-stage');

  let modalActiveProject = null;
  let modalCurrentImgIndex = 0;
  let modalImagesList = [];

  // Shop Negotiation Modal Elements
  const shopInquiryModal = document.getElementById('shop-inquiry-modal');
  const shopModalClose = document.getElementById('shop-modal-close');
  const shopModalTitle = document.getElementById('shop-modal-title');
  const shopModalImg = document.getElementById('shop-modal-img');
  const shopModalPrice = document.getElementById('shop-modal-price');
  const shopModalPriceStatus = document.getElementById('shop-modal-price-status');
  const shopModalLicense = document.getElementById('shop-modal-license');
  const shopModalCategory = document.getElementById('shop-modal-category');
  const shopModalNegChip = document.getElementById('shop-modal-neg-chip');
  const offerPriceInput = document.getElementById('offer-price-input');
  const offerContactInput = document.getElementById('offer-contact-input');
  const offerMsgInput = document.getElementById('offer-msg-input');
  const btnSendWhatsapp = document.getElementById('btn-send-whatsapp');
  const btnSendTelegram = document.getElementById('btn-send-telegram');
  const btnCopyOffer = document.getElementById('btn-copy-offer');

  let currentShopItem = null;

  // Lightbox Modal elements
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxClose = document.getElementById('lightbox-close');

  let lightboxImages = [];
  let lightboxIndex = 0;
  let lightboxTitleText = '';

  // Toast Notification System
  const toast = document.getElementById('toast');
  function showToast(msg) {
    if (!toast) return;
    toast.innerHTML = msg;
    toast.className = 'show';
    setTimeout(() => {
      toast.className = toast.className.replace('show', '');
    }, 2800);
  }

  // Client Clipboard Copy Function
  async function copyText(text, label = 'Copied to clipboard') {
    if (!text) {
      showToast('Nothing to copy');
      return;
    }
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`<i class="fa-solid fa-check"></i> ${label}`);
        return;
      } catch (err) {
        console.warn('Clipboard API blocked, using fallback', err);
      }
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showToast(`<i class="fa-solid fa-check"></i> ${label}`);
      } else {
        showToast('Copy Failed');
      }
    } catch (e) {
      showToast('Copy Failed');
    }
    document.body.removeChild(textArea);
  }

  function switchView(viewName) {
    currentView = viewName;
    [viewAbout, viewProjects, viewShop].forEach(v => { if (v) v.classList.remove('active'); });

    if (viewName === 'about' && viewAbout) {
      viewAbout.classList.add('active');
    } else if (viewName === 'projects' && viewProjects) {
      viewProjects.classList.add('active');
    } else if (viewName === 'shop' && viewShop) {
      viewShop.classList.add('active');
      renderShop();
    }
  }

  async function fetchConfig() {
    try {
      const response = await fetch(`projects/config.json?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.profile_image !== undefined) {
          appConfig.profile_image = data.profile_image;
        }
        if (data.social_links) {
          appConfig.social_links = { ...appConfig.social_links, ...data.social_links };
        }
        if (data.youtube_channels && Array.isArray(data.youtube_channels)) {
          appConfig.youtube_channels = data.youtube_channels;
        }
      }
    } catch (err) {
      console.warn('Could not load projects/config.json, using defaults.', err);
    }
    applyProfileImage(appConfig.profile_image);
    applySocialLinks();
    renderYouTubeChannels();
  }

  function applyProfileImage(imgUrl) {
    const avatarContainer = document.getElementById('profile-avatar-container') || document.querySelector('.profile-avatar');
    if (!avatarContainer) return;
    if (imgUrl && imgUrl.trim()) {
      const cleanUrl = imgUrl.trim();
      avatarContainer.innerHTML = `<img src="${cleanUrl}?t=${Date.now()}" alt="Profile Avatar" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fa-solid fa-user-astronaut\\'></i>';" />`;
    } else {
      avatarContainer.innerHTML = '<i class="fa-solid fa-user-astronaut"></i>';
    }
  }

  function renderYouTubeChannels() {
    const ytContainer = document.getElementById('youtube-links-container');
    const ytBar = document.getElementById('youtube-channels-bar');
    if (!ytContainer) return;

    const channels = appConfig.youtube_channels || [];
    if (!channels || channels.length === 0) {
      if (ytBar) ytBar.style.display = 'none';
      return;
    }

    if (ytBar) ytBar.style.display = 'flex';
    ytContainer.innerHTML = '';

    channels.forEach(ch => {
      const url = ch.url && ch.url.trim() ? ch.url.trim() : 'https://youtube.com';
      const title = ch.title && ch.title.trim() ? ch.title.trim() : 'YouTube Channel';

      const chip = document.createElement('a');
      chip.href = url;
      chip.target = '_blank';
      chip.rel = 'noopener noreferrer';
      chip.className = 'social-chip youtube';
      chip.title = `Watch channel: ${title}`;
      chip.innerHTML = `
        <i class="fa-brands fa-youtube"></i>
        <span>${title}</span>
        <i class="fa-solid fa-arrow-up-right-from-square chip-sub-icon"></i>
      `;
      ytContainer.appendChild(chip);
    });
  }

  function applySocialLinks() {
    const links = appConfig.social_links;
    const mapping = {
      'social-link-telegram': links.telegram,
      'social-link-whatsapp': links.whatsapp,
      'social-link-instagram': links.instagram,
      'social-link-facebook': links.facebook,
      'social-link-twitter': links.twitter,
      'social-link-tiktok': links.tiktok
    };
    for (const [id, url] of Object.entries(mapping)) {
      const el = document.getElementById(id);
      if (el && url) {
        el.href = url;
      }
    }
  }

  async function fetchProjects() {
    try {
      const response = await fetch(`projects/projects.json?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('No projects.json found or server not running.');
      }
      allProjects = await response.json();
    } catch (err) {
      console.warn('Fallback: Using demo dataset.', err);
      allProjects = getFallbackProjects();
    }
    updateStats();
    renderProjects();
    renderShop();
  }

  function getFallbackProjects() {
    return [
      {
        id: 'sample-portfolio',
        name: 'Developer & Cyber Portfolio Hub',
        category: 'Web Development',
        status: 'Completed',
        tags: ['HTML', 'CSS', 'JavaScript', 'Portfolio'],
        description: 'Complete overhaul of creative portfolio with modern dark theme, realistic cards and interactive showcase.',
        folder: 'sample-portfolio',
        link: 'https://example.com',
        images: ['projects/demo/cover.svg'],
        cover: 'projects/demo/cover.svg',
        is_for_sale: true,
        price: '$59',
        is_negotiable: true,
        license: 'Full Source Code + Setup',
        features: ['Full HTML5/CSS3/JS source', 'Custom responsive dark UI', 'Clean commented codebase']
      },
      {
        id: 'sec-vulnerability-scanner',
        name: 'SecAudit Vulnerability Scanner',
        category: 'Cyber Security',
        status: 'Active',
        tags: ['Python', 'Nmap', 'Security Audit', 'OWASP'],
        description: 'Automated network reconnaissance and CVE scanning utility with report generation and alert dispatching.',
        folder: 'sec-vulnerability-scanner',
        link: 'https://example.com',
        images: ['projects/demo/cover.svg'],
        cover: 'projects/demo/cover.svg',
        is_for_sale: true,
        price: '$120',
        is_negotiable: true,
        license: 'Commercial License (CLI + Script)',
        features: ['Automated multi-port scanner', 'OWASP Top 10 automated test suites', 'HTML & PDF report generator']
      }
    ];
  }

  function updateStats() {
    const showcaseProjects = allProjects.filter(p => p.is_for_sale !== true && p.is_for_sale !== '1' && p.is_for_sale !== 1);
    if (statTotal) statTotal.textContent = showcaseProjects.length;
    if (statInProgress) statInProgress.textContent = showcaseProjects.filter(p => p.status === 'In Progress').length;
    if (statCompleted) statCompleted.textContent = showcaseProjects.filter(p => p.status === 'Completed').length;
    
    const shopItems = allProjects.filter(p => p.is_for_sale === true || p.is_for_sale === '1' || p.is_for_sale === 1);
    if (shopTotalCount) shopTotalCount.textContent = shopItems.length;
  }

  function filterProjects() {
    return allProjects.filter(p => {
      const isStandardProject = p.is_for_sale !== true && p.is_for_sale !== '1' && p.is_for_sale !== 1;
      if (!isStandardProject) return false;

      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchesStatus = activeStatus === 'all' || p.status === activeStatus;
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query ||
        p.name.toLowerCase().includes(query) ||
        (p.folder && p.folder.toLowerCase().includes(query)) ||
        (p.link && p.link.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(query)));
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }

  // ================= LIGHTBOX SYSTEM =================
  function openLightbox(images, startIndex = 0, title = 'Project Image') {
    if (!images || images.length === 0) return;
    lightboxImages = images;
    lightboxIndex = Math.max(0, Math.min(startIndex, images.length - 1));
    lightboxTitleText = title;
    updateLightbox();
    lightboxModal.classList.add('active');
  }

  function updateLightbox() {
    if (!lightboxImages || lightboxImages.length === 0) return;
    lightboxImg.src = lightboxImages[lightboxIndex];
    lightboxCaption.textContent = lightboxTitleText;
    lightboxCounter.textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;

    if (lightboxImages.length <= 1) {
      lightboxPrev.style.display = 'none';
      lightboxNext.style.display = 'none';
    } else {
      lightboxPrev.style.display = 'flex';
      lightboxNext.style.display = 'flex';
    }
  }

  function lightboxStep(direction) {
    if (!lightboxImages || lightboxImages.length <= 1) return;
    lightboxIndex = (lightboxIndex + direction + lightboxImages.length) % lightboxImages.length;
    updateLightbox();
  }

  function closeLightbox() {
    lightboxModal.classList.remove('active');
  }

  if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); lightboxStep(-1); });
  if (lightboxNext) lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); lightboxStep(1); });
  if (lightboxClose) lightboxClose.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal || e.target.classList.contains('lightbox-container')) {
        closeLightbox();
      }
    });
  }

  // ================= MODAL SLIDER SYSTEM =================
  function setModalSlide(index) {
    if (modalImagesList.length === 0) {
      modalSliderImg.src = 'projects/demo/cover.svg';
      modalSliderCounter.textContent = '0 / 0';
      return;
    }
    modalCurrentImgIndex = (index + modalImagesList.length) % modalImagesList.length;
    modalSliderImg.src = modalImagesList[modalCurrentImgIndex];
    modalSliderCounter.textContent = `${modalCurrentImgIndex + 1} / ${modalImagesList.length}`;

    const thumbs = modalSliderThumbs.querySelectorAll('.slider-thumb');
    thumbs.forEach((th, idx) => {
      if (idx === modalCurrentImgIndex) {
        th.classList.add('active');
        th.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        th.classList.remove('active');
      }
    });
  }

  function modalStep(direction) {
    if (modalImagesList.length <= 1) return;
    setModalSlide(modalCurrentImgIndex + direction);
  }

  if (modalSliderPrev) modalSliderPrev.addEventListener('click', (e) => { e.stopPropagation(); modalStep(-1); });
  if (modalSliderNext) modalSliderNext.addEventListener('click', (e) => { e.stopPropagation(); modalStep(1); });
  if (modalSliderStage) {
    modalSliderStage.addEventListener('click', () => {
      if (modalImagesList.length > 0) {
        openLightbox(modalImagesList, modalCurrentImgIndex, modalActiveProject ? modalActiveProject.name : 'Project Image');
      }
    });
  }

  // ================= SHOP RENDERER & INTERACTION =================
  function filterShopItems() {
    return allProjects.filter(p => {
      // Only show items that are explicitly flagged for sale
      const isShopItem = p.is_for_sale === true || p.is_for_sale === '1' || p.is_for_sale === 1;
      if (!isShopItem) return false;

      const matchesCategory = activeShopCategory === 'all' || p.category === activeShopCategory;
      const matchesNegotiable = !filterNegotiableOnly || (p.is_negotiable === true || p.is_negotiable === '1' || p.is_negotiable === 1);
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query ||
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(query)));

      return matchesCategory && matchesNegotiable && matchesSearch;
    });
  }

  // Reusable Pagination Renderer
  function renderPagination(container, currentPage, totalPages, totalItems, onPageChange) {
    if (!container) return;
    if (totalItems === 0) {
      container.innerHTML = '';
      return;
    }

    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    let buttonsHtml = '';
    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';

    buttonsHtml += `<button class="pagination-btn" data-page="${currentPage - 1}" ${prevDisabled} title="Previous Page"><i class="fa-solid fa-chevron-left"></i></button>`;

    if (totalPages <= 7) {
      for (let p = 1; p <= totalPages; p++) {
        buttonsHtml += `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      }
    } else {
      if (currentPage <= 4) {
        for (let p = 1; p <= 5; p++) {
          buttonsHtml += `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        }
        buttonsHtml += `<span class="pagination-ellipsis">...</span>`;
        buttonsHtml += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
      } else if (currentPage >= totalPages - 3) {
        buttonsHtml += `<button class="pagination-btn" data-page="1">1</button>`;
        buttonsHtml += `<span class="pagination-ellipsis">...</span>`;
        for (let p = totalPages - 4; p <= totalPages; p++) {
          buttonsHtml += `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        }
      } else {
        buttonsHtml += `<button class="pagination-btn" data-page="1">1</button>`;
        buttonsHtml += `<span class="pagination-ellipsis">...</span>`;
        for (let p = currentPage - 1; p <= currentPage + 1; p++) {
          buttonsHtml += `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        }
        buttonsHtml += `<span class="pagination-ellipsis">...</span>`;
        buttonsHtml += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
      }
    }

    buttonsHtml += `<button class="pagination-btn" data-page="${currentPage + 1}" ${nextDisabled} title="Next Page"><i class="fa-solid fa-chevron-right"></i></button>`;

    container.innerHTML = `
      <div class="pagination-info">
        Showing <strong>${startItem} - ${endItem}</strong> of <strong>${totalItems}</strong> items (Page ${currentPage} of ${totalPages})
      </div>
      <div class="pagination-controls">
        ${buttonsHtml}
      </div>
    `;

    const btns = container.querySelectorAll('.pagination-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetPage = parseInt(btn.dataset.page, 10);
        if (targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
          onPageChange(targetPage);
        }
      });
    });
  }

  function renderShop() {
    if (!shopGrid) return;
    const shopItems = filterShopItems();
    const totalItems = shopItems.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

    if (currentShopPage > totalPages) currentShopPage = totalPages;
    if (currentShopPage < 1) currentShopPage = 1;

    shopGrid.innerHTML = '';

    if (totalItems === 0) {
      shopGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted); background: var(--bg-card); border-radius: 12px; border: 1px dashed rgba(245, 158, 11, 0.3);">
          <i class="fa-solid fa-basket-shopping" style="font-size: 3rem; color: var(--gold); margin-bottom: 14px;"></i>
          <h3 style="color: #fff; font-size: 1.25rem;">No Software Listed in Store Matching Criteria</h3>
          <p style="font-size: 0.9rem; margin-top: 8px;">You can list any software for sale with negotiable pricing using the desktop app (<code>python gui.py</code>).</p>
        </div>
      `;
      if (shopPagination) shopPagination.innerHTML = '';
      return;
    }

    const startIndex = (currentShopPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
    const paginatedItems = shopItems.slice(startIndex, endIndex);

    paginatedItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'shop-card';

      const cover = item.cover || (item.images && item.images[0]) || 'projects/demo/cover.svg';
      const priceDisplay = item.price ? (item.price.startsWith('$') ? item.price : `$${item.price}`) : 'Quote';
      const isNegotiable = item.is_negotiable !== false;
      const licenseText = item.license || 'Full Source Code';

      const features = Array.isArray(item.features) && item.features.length > 0 
        ? item.features 
        : ['Full Source Code Included', 'Lifetime Updates & Bug Fixes', 'Direct Developer Support'];

      const featuresListHtml = features.slice(0, 3).map(f => `<li><i class="fa-solid fa-circle-check"></i> ${f}</li>`).join('');

      card.innerHTML = `
        <div class="shop-card-badge-row">
          <span class="shop-license-badge"><i class="fa-solid fa-certificate"></i> ${licenseText}</span>
          ${isNegotiable 
            ? '<span class="shop-negotiable-badge"><i class="fa-solid fa-handshake"></i> Negotiable / قابل للتفاوض</span>' 
            : '<span class="shop-fixed-badge">Fixed Price</span>'}
        </div>
        <div class="shop-card-img-wrap" title="Click to view screenshots">
          <img src="${cover}" class="shop-card-img" alt="${item.name}" onerror="this.onerror=null; this.src='projects/demo/cover.svg';" />
        </div>
        <div class="shop-card-content">
          <div class="shop-card-header">
            <h3 class="shop-card-title">${item.name}</h3>
            <div class="shop-price-tag">
              <div class="shop-price-main">${priceDisplay}</div>
              <div class="shop-price-sub">${isNegotiable ? 'قابل للتفاوض' : 'Fixed'}</div>
            </div>
          </div>
          <p class="shop-card-desc">${item.description || 'Premium software solution ready for deployment.'}</p>
          <ul class="shop-card-features">
            ${featuresListHtml}
          </ul>
          <div class="shop-card-footer">
            <button class="btn-buy-action" data-id="${item.id}">
              <i class="fa-solid fa-comment-dollar"></i> Make Offer / التفاوض والشراء
            </button>
            ${item.link && item.link.startsWith('http') ? `
              <button class="btn-demo-action" data-link="${item.link}" title="Live Demo">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Demo
              </button>
            ` : ''}
          </div>
        </div>
      `;

      // Thumbnail image click opens lightbox
      const imgWrap = card.querySelector('.shop-card-img-wrap');
      if (imgWrap) {
        imgWrap.addEventListener('click', () => {
          const imgs = (item.images && item.images.length > 0) ? item.images : [cover];
          openLightbox(imgs, 0, item.name);
        });
      }

      // Buy & Negotiate action button
      const buyBtn = card.querySelector('.btn-buy-action');
      if (buyBtn) {
        buyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openShopInquiryModal(item);
        });
      }

      // Demo button
      const demoBtn = card.querySelector('.btn-demo-action');
      if (demoBtn) {
        demoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.open(item.link, '_blank');
        });
      }

      shopGrid.appendChild(card);
    });

    renderPagination(shopPagination, currentShopPage, totalPages, totalItems, (newPage) => {
      currentShopPage = newPage;
      renderShop();
      const shopViewTop = document.getElementById('view-shop');
      if (shopViewTop) shopViewTop.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // OPEN SHOP INQUIRY & NEGOTIATION MODAL
  function openShopInquiryModal(item) {
    currentShopItem = item;
    const cover = item.cover || (item.images && item.images[0]) || 'projects/demo/cover.svg';
    const priceDisplay = item.price ? (item.price.startsWith('$') ? item.price : `$${item.price}`) : '$0';
    const isNegotiable = item.is_negotiable !== false;

    if (shopModalTitle) shopModalTitle.textContent = item.name;
    if (shopModalImg) shopModalImg.src = cover;
    if (shopModalPrice) shopModalPrice.textContent = priceDisplay;
    if (shopModalLicense) shopModalLicense.textContent = item.license || 'Full Source Code';
    if (shopModalCategory) shopModalCategory.textContent = item.category || 'General';

    if (shopModalPriceStatus) {
      shopModalPriceStatus.textContent = isNegotiable 
        ? '✨ السعر قابل للتفاوض - Price is Open to Offers' 
        : 'Fixed Price Listing - Direct Purchase';
    }

    if (shopModalNegChip) {
      shopModalNegChip.textContent = isNegotiable ? 'Negotiable / قابل للتفاوض' : 'Fixed Price';
    }

    if (offerPriceInput) {
      // Prefill with existing price as a baseline suggestion
      const rawPrice = item.price ? item.price.replace(/[^0-9.]/g, '') : '';
      offerPriceInput.value = rawPrice ? `${rawPrice}` : '';
    }

    if (offerMsgInput) {
      offerMsgInput.value = `Hello! I am interested in acquiring '${item.name}'. Listed price is ${priceDisplay}.`;
    }

    shopInquiryModal.classList.add('active');
  }

  function generateInquiryText() {
    if (!currentShopItem) return '';
    const proposedPrice = offerPriceInput ? offerPriceInput.value.trim() : '';
    const contactName = offerContactInput ? offerContactInput.value.trim() : '';
    const customMsg = offerMsgInput ? offerMsgInput.value.trim() : '';
    const originalPrice = currentShopItem.price || 'Negotiable';

    return `🔥 [Software Purchase & Negotiation Inquiry]\n` +
      `---------------------------------\n` +
      `📦 Software: ${currentShopItem.name}\n` +
      `🏷️ Listed Price: ${originalPrice}\n` +
      `💰 Proposed Counter-Offer: ${proposedPrice ? '$' + proposedPrice : 'Open to negotiate'}\n` +
      `👤 Buyer/Handle: ${contactName || 'Anonymous Client'}\n` +
      `💬 Message: ${customMsg}\n` +
      `---------------------------------`;
  }

  if (btnSendWhatsapp) {
    btnSendWhatsapp.addEventListener('click', () => {
      const text = encodeURIComponent(generateInquiryText());
      let waUrl = appConfig.social_links && appConfig.social_links.whatsapp ? appConfig.social_links.whatsapp : '';
      if (waUrl && waUrl.includes('wa.me/')) {
        const base = waUrl.endsWith('/') ? waUrl.slice(0, -1) : waUrl;
        window.open(`${base}?text=${text}`, '_blank');
      } else {
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      }
    });
  }

  if (btnSendTelegram) {
    btnSendTelegram.addEventListener('click', () => {
      const text = encodeURIComponent(generateInquiryText());
      let tgUrl = appConfig.social_links && appConfig.social_links.telegram ? appConfig.social_links.telegram : '';
      if (tgUrl && tgUrl.includes('t.me/')) {
        let handle = tgUrl.split('t.me/')[1]?.replace(/[^a-zA-Z0-9_]/g, '');
        if (handle) {
          window.open(`https://t.me/${handle}`, '_blank');
          return;
        }
      }
      window.open(`https://t.me/share/url?url=${text}`, '_blank');
    });
  }

  if (btnCopyOffer) {
    btnCopyOffer.addEventListener('click', () => {
      const text = generateInquiryText();
      copyText(text, 'Offer message copied to clipboard');
    });
  }

  if (shopModalClose) {
    shopModalClose.addEventListener('click', () => {
      shopInquiryModal.classList.remove('active');
    });
  }

  // Category buttons for shop filter
  shopCategoryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      shopCategoryFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeShopCategory = btn.dataset.shopCat || 'all';
      currentShopPage = 1;
      renderShop();
    });
  });

  if (checkFilterNegotiable) {
    checkFilterNegotiable.addEventListener('change', (e) => {
      filterNegotiableOnly = e.target.checked;
      currentShopPage = 1;
      renderShop();
    });
  }

  // GLOBAL KEYBOARD NAVIGATION
  window.addEventListener('keydown', (e) => {
    if (lightboxModal && lightboxModal.classList.contains('active')) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); lightboxStep(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); lightboxStep(1); }
      else if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
      return;
    }

    if (modal && modal.classList.contains('active')) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); modalStep(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); modalStep(1); }
      else if (e.key === 'Escape') { e.preventDefault(); modal.classList.remove('active'); }
      return;
    }

    if (shopInquiryModal && shopInquiryModal.classList.contains('active')) {
      if (e.key === 'Escape') {
        shopInquiryModal.classList.remove('active');
      }
    }
  });

  // REALISTIC CARD GENERATOR FOR ALL PROJECTS
  function renderProjects() {
    if (!projectsGrid) return;
    const filtered = filterProjects();
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

    if (currentProjectsPage > totalPages) currentProjectsPage = totalPages;
    if (currentProjectsPage < 1) currentProjectsPage = 1;

    if (projectCount) {
      projectCount.textContent = `${totalItems} project${totalItems === 1 ? '' : 's'}`;
    }
    projectsGrid.innerHTML = '';

    if (totalItems === 0) {
      projectsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px 0; color: var(--text-muted); background: var(--bg-card); border-radius: 10px; border: 1px dashed var(--secondary);">
          <i class="fa-regular fa-folder-open" style="font-size: 2.5rem; color: var(--accent); margin-bottom: 12px;"></i>
          <h4 style="color: #fff; font-size: 1.15rem;">No matching projects found</h4>
          <p style="font-size: 0.9rem; margin-top: 6px;">Adjust your search query or add new projects via <code>python gui.py</code>.</p>
        </div>
      `;
      if (projectsPagination) projectsPagination.innerHTML = '';
      return;
    }

    const startIndex = (currentProjectsPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
    const paginatedItems = filtered.slice(startIndex, endIndex);

    paginatedItems.forEach(proj => {
      const card = document.createElement('div');
      card.className = 'card';

      const statusClass = (proj.status || 'Active').toLowerCase().replace(/\s+/g, '');
      const statusText = proj.status || 'Active';
      const projectUrl = proj.link && proj.link.trim() ? proj.link.trim() : '#';

      let allImages = [];
      if (Array.isArray(proj.images) && proj.images.length > 0) { 
        allImages = [...proj.images]; 
      } else if (proj.cover) { 
        allImages = [proj.cover]; 
      }
      if (allImages.length === 0) {
        allImages = ['projects/demo/cover.svg'];
      }
      const initialCover = proj.cover || allImages[0];

      const imgHtml = `
        <div class="card-img-wrap" title="Click to view images in pop-up">
          <img src="${initialCover}" class="card-img main-card-img" alt="${proj.name}" onerror="this.onerror=null; this.src='projects/demo/cover.svg';" />
          <div class="card-img-overlay"><i class="fa-solid fa-arrows-up-down-left-right"></i></div>
        </div>
      `;

      const tagsHtml = (proj.tags && proj.tags.length > 0)
        ? proj.tags.map(t => {
            const cleanTag = t.startsWith('#') ? t.substring(1) : t;
            return `<span class="tag"><i class="fa-solid fa-code" style="font-size:0.65rem; margin-right:4px; opacity:0.6;"></i>${cleanTag}</span>`;
          }).join('')
        : '<span class="tag">General</span>';

      let galleryHtml = '';
      if (allImages.length > 0) {
        const thumbsHtml = allImages.map((imgSrc, idx) => `
          <img src="${imgSrc}" 
               class="card-gallery-thumb ${idx === 0 ? 'active' : ''}" 
               alt="Thumbnail ${idx + 1}" 
               data-index="${idx}"
               data-src="${imgSrc}"
               title="Click to pop up image ${idx + 1}"
               onerror="this.onerror=null; this.src='projects/demo/cover.svg';" />
        `).join('');

        galleryHtml = `
          <div class="card-gallery-section">
            <div class="card-gallery-header">
              <span class="card-gallery-title"><i class="fa-solid fa-images"></i> Gallery</span>
              <span class="card-gallery-count">${allImages.length} image${allImages.length > 1 ? 's' : ''}</span>
            </div>
            <div class="card-gallery-list">
              ${thumbsHtml}
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="category-badge">${proj.category || 'General'}</div>
        <div class="status-badge status-${statusClass}">
          <span class="status-dot ${statusClass === 'completed' ? 'online' : ''}"></span> ${statusText}
        </div>
        ${imgHtml}
        <div class="card-content">
          <div class="card-title" title="${proj.name}">
            <span class="card-title-text">${proj.name}</span>
            <i class="fa-solid fa-circle-info inspect-icon" title="View Project Info" data-id="${proj.id}"></i>
          </div>

          <div class="card-url" title="${projectUrl !== '#' ? projectUrl : proj.name}">
            <i class="fa-solid fa-globe"></i> ${projectUrl !== '#' ? projectUrl : 'Internal Project'}
          </div>

          <p class="card-desc" title="${proj.description || ''}">
            ${proj.description || 'No description provided for this project.'}
          </p>

          ${galleryHtml}

          <div class="tags">${tagsHtml}</div>

          <div class="actions">
            ${projectUrl !== '#' ? `
              <button class="action-btn link-btn" data-url="${projectUrl}" title="Open Live Project">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Live Link
              </button>
            ` : `
              <button class="action-btn disabled" style="opacity:0.3; cursor:not-allowed;" title="No external link">
                <i class="fa-solid fa-link-slash"></i> No Link
              </button>
            `}
            <div class="action-divider"></div>
            <button class="action-btn detail-btn" data-id="${proj.id}" title="Preview Project">
              <i class="fa-solid fa-eye"></i> Details
            </button>
          </div>
        </div>
      `;

      const cardImgWrap = card.querySelector('.card-img-wrap');
      if (cardImgWrap) {
        cardImgWrap.addEventListener('click', (e) => {
          e.stopPropagation();
          openLightbox(allImages, 0, proj.name);
        });
      }

      const galleryThumbs = card.querySelectorAll('.card-gallery-thumb');
      galleryThumbs.forEach((thumb) => {
        thumb.addEventListener('click', (e) => {
          e.stopPropagation();
          galleryThumbs.forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
          const mainImg = card.querySelector('.main-card-img');
          if (mainImg) {
            mainImg.src = thumb.dataset.src;
          }
          const targetIdx = parseInt(thumb.dataset.index, 10) || 0;
          openLightbox(allImages, targetIdx, proj.name);
        });
      });

      const inspectIcon = card.querySelector('.inspect-icon');
      if (inspectIcon) inspectIcon.addEventListener('click', (e) => { e.stopPropagation(); openDetailModal(proj); });

      const detailBtn = card.querySelector('.detail-btn');
      if (detailBtn) detailBtn.addEventListener('click', (e) => { e.stopPropagation(); openDetailModal(proj); });

      const linkBtn = card.querySelector('.link-btn');
      if (linkBtn) {
        linkBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.open(projectUrl, '_blank');
        });
      }

      card.addEventListener('click', () => openDetailModal(proj));
      projectsGrid.appendChild(card);
    });

    renderPagination(projectsPagination, currentProjectsPage, totalPages, totalItems, (newPage) => {
      currentProjectsPage = newPage;
      renderProjects();
      const projViewTop = document.getElementById('view-projects');
      if (projViewTop) projViewTop.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function openDetailModal(proj) {
    modalActiveProject = proj;
    modalTitle.textContent = proj.name;

    if (modalCatChip) modalCatChip.textContent = proj.category || 'General';
    const statusText = proj.status || 'Active';
    const isCompleted = statusText.toLowerCase() === 'completed';
    if (modalStatusChip) {
      modalStatusChip.innerHTML = `<span class="dot ${isCompleted ? 'green' : 'yellow'}"></span> ${statusText}`;
    }

    if (specCategory) specCategory.textContent = proj.category || 'General';
    if (specStatus) specStatus.textContent = statusText;

    if (modalTags) {
      if (proj.tags && proj.tags.length > 0) {
        modalTags.innerHTML = proj.tags.map(t => {
          const clean = t.startsWith('#') ? t.substring(1) : t;
          return `<span class="tag"><i class="fa-solid fa-code" style="font-size:0.65rem; margin-right:4px; opacity:0.6;"></i>${clean}</span>`;
        }).join(' ');
      } else {
        modalTags.innerHTML = '<span class="tag">General</span>';
      }
    }

    if (modalDescription) {
      modalDescription.textContent = proj.description || 'No detailed description provided for this project.';
    }

    const hasValidLink = proj.link && proj.link.trim().startsWith('http');
    if (specLinkRow) {
      if (hasValidLink) {
        specLinkRow.style.display = 'flex';
        specLinkText.textContent = proj.link.trim();
        specLinkText.title = proj.link.trim();
      } else {
        specLinkRow.style.display = 'none';
      }
    }

    if (modalLink) {
      if (hasValidLink) {
        modalLink.href = proj.link.trim();
        modalLink.style.display = 'inline-flex';
      } else {
        modalLink.style.display = 'none';
      }
    }

    if (modalCopyLinkBtn) {
      modalCopyLinkBtn.onclick = (e) => {
        e.stopPropagation();
        if (hasValidLink) {
          copyText(proj.link.trim(), 'Project link copied');
        } else {
          copyText(proj.name, 'Project name copied');
        }
      };
    }

    modalImagesList = [];
    if (Array.isArray(proj.images) && proj.images.length > 0) {
      modalImagesList = [...proj.images];
    } else if (proj.cover) {
      modalImagesList = [proj.cover];
    } else {
      modalImagesList = ['projects/demo/cover.svg'];
    }

    if (specAssetsCount) {
      specAssetsCount.textContent = `${modalImagesList.length} image${modalImagesList.length === 1 ? '' : 's'}`;
    }

    modalSliderThumbs.innerHTML = '';
    if (modalImagesList.length <= 1) {
      modalSliderPrev.style.display = 'none';
      modalSliderNext.style.display = 'none';
    } else {
      modalSliderPrev.style.display = 'flex';
      modalSliderNext.style.display = 'flex';
    }

    modalImagesList.forEach((src, idx) => {
      const th = document.createElement('img');
      th.src = src;
      th.className = `slider-thumb ${idx === 0 ? 'active' : ''}`;
      th.alt = `Thumbnail ${idx + 1}`;
      th.title = `Switch to image ${idx + 1}`;
      th.onerror = () => { th.src = 'projects/demo/cover.svg'; };
      th.addEventListener('click', (e) => {
        e.stopPropagation();
        setModalSlide(idx);
      });
      modalSliderThumbs.appendChild(th);
    });

    setModalSlide(0);
    modal.classList.add('active');
  }

  if (modalClose) {
    modalClose.addEventListener('click', () => modal.classList.remove('active'));
  }
  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
    if (e.target === shopInquiryModal) shopInquiryModal.classList.remove('active');
  });

  // Search listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      currentProjectsPage = 1;
      currentShopPage = 1;
      if (searchQuery.trim().length > 0 && currentView === 'about') {
        switchView('projects');
        const allProjTab = document.querySelector('[data-category="all"]');
        if (allProjTab) {
          navItems.forEach(n => n.classList.remove('active'));
          allProjTab.classList.add('active');
        }
      }
      renderProjects();
      renderShop();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      activeStatus = e.target.value;
      currentProjectsPage = 1;
      renderProjects();
    });
  }

  // Sidebar navigation handlers
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (item.tagName === 'A' || item.hasAttribute('href')) {
        return;
      }
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      const view = item.dataset.view;
      if (view === 'about') {
        switchView('about');
      } else if (view === 'shop') {
        switchView('shop');
      } else {
        switchView('projects');
        activeCategory = item.dataset.category || 'all';
        categoryTitle.textContent = item.textContent.trim();
        currentProjectsPage = 1;
        renderProjects();
      }
    });
  });

  if (btnSwitchProjects) {
    btnSwitchProjects.addEventListener('click', () => {
      const allProjectsBtn = document.querySelector('[data-category="all"]');
      if (allProjectsBtn) allProjectsBtn.click();
    });
  }

  if (btnHeroShop) {
    btnHeroShop.addEventListener('click', () => {
      const shopTab = document.getElementById('tab-shop');
      if (shopTab) shopTab.click();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetchProjects();
      showToast('<i class="fa-solid fa-arrows-rotate"></i> Refreshed items');
    });
  }

  switchView('about');
  fetchConfig();
  fetchProjects();
});
