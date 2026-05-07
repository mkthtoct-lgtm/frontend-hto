const initAppToggler = () => {

    const appTogglers = document.querySelectorAll(".app-toggler");
    const appMenubars = document.querySelectorAll(".app-menubar");

    appTogglers.forEach(toggler => {
        toggler.addEventListener("click", () => {
            toggler.classList.toggle("active");

            if (window.innerWidth >= 1191) {
                const currentValue = document.documentElement.getAttribute("data-app-sidebar");
                
				if (currentValue === "full") {
                    document.documentElement.setAttribute("data-app-sidebar", "mini");
                } else {
                    document.documentElement.setAttribute("data-app-sidebar", "full");
                }
			} else {
                appMenubars.forEach(menubar => {
                    menubar.classList.toggle("open");
                });
            }
        });
    });
};

const currentYear = () => {
    const elements = document.querySelectorAll('.currentYear');
    const currentYear = new Date().getFullYear();

    elements.forEach(element => {
        element.textContent = currentYear;
    });
};

const initElementHeight = () => {
    const footer = document.querySelector('.footer-wrapper');
	if (footer) {
		const footerHeight = footer ? footer.offsetHeight : 0;
		document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
	}
	
	const chatBox = document.querySelector('.chat-wrapper');
	if (chatBox) {
		const chatHeight = chatBox.offsetHeight;
		document.documentElement.style.setProperty('--chat-height', `${chatHeight}px`);
	}
	
};

const initSelectPicker = () => {
	
	document.querySelectorAll('.select-status').forEach(dropdown => {
		const toggleButton = dropdown.querySelector('.dropdown-toggle');
		const items = dropdown.querySelectorAll('.dropdown-item');

		const updateButtonClassAndText = (text, selectedClass) => {
			// Remove btn-* except btn-sm, btn-lg
			toggleButton.classList.forEach(cls => {
				if (/^btn-/.test(cls) && !['btn-sm', 'btn-lg'].includes(cls)) {
					toggleButton.classList.remove(cls);
				}
			});

			if (selectedClass) {
				toggleButton.classList.add(...selectedClass.split(' '));
			}

			toggleButton.textContent = text;
		};

		// Handle default selection on page load
		const selectedItem = dropdown.querySelector('.dropdown-item[data-selected="true"]');
		if (selectedItem) {
			const defaultText = selectedItem.textContent.trim();
			const defaultClass = selectedItem.getAttribute('data-class');
			updateButtonClassAndText(defaultText, defaultClass);
		}

		// Handle selection on click
		items.forEach(item => {
			item.addEventListener('click', (e) => {
				e.preventDefault();
				items.forEach(i => i.removeAttribute('data-selected'));
				item.setAttribute('data-selected', 'true');

				const selectedText = item.textContent.trim();
				const selectedClass = item.getAttribute('data-class');
				updateButtonClassAndText(selectedText, selectedClass);
			});
		});
	});
};

function initSectionCheckboxSync() {
    document.querySelectorAll('.data-row-checkbox').forEach(function(section) {
        const masterCheckbox = section.querySelector('[data-row-checkbox]');
        const checkboxes = section.querySelectorAll('[data-checkbox]');

        if (!masterCheckbox || checkboxes.length === 0) return;

        masterCheckbox.addEventListener('change', function() {
            const checked = this.checked;
            checkboxes.forEach(function(cb) {
                cb.checked = checked;
            });
        });

        checkboxes.forEach(function(cb) {
            cb.addEventListener('change', function() {
                const allChecked = Array.from(checkboxes).every(c => c.checked);
                masterCheckbox.checked = allChecked;
            });
        });
    });
}

function initTooltips() {
	const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
	const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

function initPopover() {
	var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
	var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
		return new bootstrap.Popover(popoverTriggerEl)
	})
}

const initSidebarMenu = () => {

    const $menuLinks = jQuery('.app-navbar .menubar > li.menu-arrow > a, .app-navbar .menu-inner > li > a');

    // =========================
    // Close all menus
    // =========================
    jQuery('.app-navbar .menubar > li.menu-arrow > a')
        .next('.menu-inner')
        .hide();

    jQuery('.app-navbar .menu-inner > li > a')
        .next('.menu-inner')
        .hide();

    // =========================
    // Click Toggle
    // =========================
    $menuLinks.off('click').on('click', function (e) {

        const $this = jQuery(this);
        const $submenu = $this.next('.menu-inner');
        const hasSubmenu = $submenu.length > 0;

        if ($this.hasClass('open')) {
            $this.removeClass('open');
            $submenu.slideUp();
            return;
        }

        if (!e.ctrlKey) {
            $this.addClass('open');
        }

        if (hasSubmenu) {
            e.preventDefault();

            $submenu.slideDown();

            // Close siblings
            $this.parent('li')
                .siblings('li')
                .find('a')
                .removeClass('open')
                .next('.menu-inner')
                .slideUp();
        }
    });


    // =========================
    // Active Menu
    // =========================
    const currentUrl = window.location.href;

    let $activeLink = jQuery(".app-navbar .menubar a").filter(function () {
        return this.href === currentUrl;
    });

    if ($activeLink.length) {

        $activeLink.addClass("active");

        let $parent = $activeLink.parent();

        while ($parent.length && !$parent.is('.menubar')) {

            $parent.addClass("active");

            const $parentMenu = $parent.children('.menu-inner');

            if ($parentMenu.length) {
                $parentMenu.show();
            }

            $parent = $parent.parent().closest('li');
        }
    }
}


function initCheckable() {
    document.querySelectorAll('.checkable-wrapper').forEach(function(wrapper) {
        const checkAll = wrapper.querySelector('.checkable-check-all');
        const checkboxes = wrapper.querySelectorAll('.checkable-check-input');

        // Initialize checked state on load
        checkboxes.forEach(function(checkbox) {
            const item = checkbox.closest('.checkable-item');
            if (checkbox.checked && item) {
                item.classList.add('is-checked');
            }
        });

        // Handle "Select All"
        if (checkAll) {
            checkAll.addEventListener('change', function () {
                const isChecked = this.checked;
                checkboxes.forEach(function(checkbox) {
                    checkbox.checked = isChecked;
                    const item = checkbox.closest('.checkable-item');
                    if (item) {
                        item.classList.toggle('is-checked', isChecked);
                    }
                });
            });
        }

        // Handle individual checkbox toggle
        wrapper.addEventListener('change', function (e) {
            if (e.target.matches('.checkable-check-input')) {
                const item = e.target.closest('.checkable-item');
                if (item) {
                    item.classList.toggle('is-checked', e.target.checked);
                }

                // Update "Select All" state
                const allChecked = wrapper.querySelectorAll('.checkable-check-input:not(:checked)').length === 0;
                if (checkAll) {
                    checkAll.checked = allChecked;
                }
            }
        });
    });
}

function initEmailSidebarToggle() {
    const toggler = document.querySelector('.mail-sidebar-toggler');
    const sidebar = document.querySelector('.mail-sidebar');
    const overlay = document.querySelector('.sidebar-mobile-overlay');

    if (toggler && sidebar && overlay) {
        toggler.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show', sidebar.classList.contains('open'));
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    }
}

function initChatSidebarToggle() {
    const toggler = document.querySelector('.chat-sidebar-toggler');
	const sidebar = document.querySelector('.chat-sidebar');
	const overlay = document.querySelector('.sidebar-mobile-overlay');
	const btnClose = document.querySelector('.btn-close');

	if (!toggler || !sidebar || !overlay) return;

	toggler.addEventListener('click', () => {
		sidebar.classList.toggle('open');
		overlay.classList.toggle('show', sidebar.classList.contains('open'));
	});

	overlay.addEventListener('click', () => {
		sidebar.classList.remove('open');
		overlay.classList.remove('show');
	});

	if (btnClose) {
		btnClose.addEventListener('click', () => {
			sidebar.classList.remove('open');
			overlay.classList.remove('show');
		});
	}
}

function initBookmarks() {
    document.addEventListener('click', (e) => {
        const bookmark = e.target.closest('.mail-item-bookmark');
        if (bookmark) {
            bookmark.classList.toggle('active');
        }
    });
}

const initThemeSwitcher = () => {
	'use strict';

	// Cookie helpers
	const getCookie = (name) => {
	  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
	  return match ? match[2] : null;
	};

	const setCookie = (name, value, days = 365) => {
	  const expires = new Date(Date.now() + days * 864e5).toUTCString();
	  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
	};

	const getStoredTheme = () => getCookie('theme');
	const setStoredTheme = (theme) => setCookie('theme', theme);

	// Preferred theme
	const getPreferredTheme = () => {
	  const storedTheme = getStoredTheme();
	  if (storedTheme) return storedTheme;
	  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	};

	// Apply theme
	const setTheme = (theme) => {
	  document.documentElement.setAttribute('data-bs-theme', theme);
	};

	// Page Ready
	$(document).ready(function () {
	  // 🔹 On load: apply saved/preferred theme
	  const preferredTheme = getPreferredTheme();
	  setTheme(preferredTheme);

	  // 🔹 Restore active state on button
	  if (preferredTheme === 'dark') {
		$('.theme-btn').addClass('active');
	  } else {
		$('.theme-btn').removeClass('active');
	  }

	  // 🔹 Click handler
	  $('.theme-btn').on('click', function () {
		$(this).toggleClass('active');

		let currentTheme = document.documentElement.getAttribute('data-bs-theme');
		let newTheme = currentTheme === 'dark' ? 'light' : 'dark';

		setTheme(newTheme);
		setStoredTheme(newTheme);
	  });
	});
};

/* ================================
	PASSWORD TOGGLE
================================ */
const passwordToggle = () => {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-password');
        if (!btn) return;

        const wrapper = btn.closest('.password-wrapper');
        const input = wrapper ? wrapper.querySelector('input') : null;

        if (!input) return;

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';

        btn.classList.toggle('active', isPassword);
    });
};

document.addEventListener("DOMContentLoaded", () => {
	initAppToggler();
	initElementHeight();
	passwordToggle();
	currentYear();
	initSectionCheckboxSync();
	initSelectPicker();
	initTooltips();
	initPopover();
	initCheckable();
	initSidebarMenu();
	initEmailSidebarToggle();
	initChatSidebarToggle();
	initBookmarks();
	initThemeSwitcher();
});


$(document).ready(function () {
	$('.dataTable').each(function() {
		const dtInstance = $(this).DataTable();
		dtInstance.on('draw.dt', function() {
			initSelectPicker();
			initSectionCheckboxSync();
		});
	});
});