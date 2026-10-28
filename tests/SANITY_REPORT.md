# Shringaar Website Sanity Report

Generated: 2026-10-27T14:37:49.461Z

## Route checklist

| Page | URL | Status |
|---|---|---|
| Home | `/` | Review findings |
| Search | `/search?q=jhumka` | Review findings |
| Search no results | `/search?q=not-a-real-jewellery-piece` | Pass |
| Category jhumkas | `/categories/jhumkas` | Review findings |
| Category bridal sets | `/categories/bridal-sets` | Pass |
| Product detail | `/products/noor-kundan-dome-jhumkas` | Review findings |
| Collection festive | `/collections/festive-glow` | Pass |
| Collection bridal | `/collections/bridal-edit` | Pass |
| Occasion bridal | `/occasion/bridal` | Pass |
| Budget under 1500 | `/budget/under-1500` | Review findings |
| Cart | `/cart` | Pass |
| Checkout | `/checkout` | Pass |
| Payment result | `/checkout/payment-result` | Pass |
| Login | `/login` | Pass |
| Register | `/register` | Pass |
| Forgot password | `/forgot-password` | Pass |
| Reset password | `/reset-password?error=INVALID_TOKEN` | Pass |
| Account overview | `/account` | Pass |
| Account addresses | `/account/addresses` | Pass |
| Account orders | `/account/orders` | Pass |
| Admin login | `/admin/login` | Pass |
| Admin dashboard | `/admin` | Pass |
| Admin orders | `/admin/orders` | Pass |
| Admin order detail | `/admin/orders/sanity-sample-id` | Pass |
| Design system | `/design-system` | Pass |
| Wishlist (not implemented) | `/wishlist` | Expected 404 |
| Privacy policy (not implemented) | `/privacy` | Expected 404 |
| Terms (not implemented) | `/terms` | Expected 404 |
| Shipping policy (not implemented) | `/shipping-policy` | Expected 404 |
| 404 | `/this-page-does-not-exist` | Expected 404 |

This recorded route and screenshot run predates the Firebase migration and is evidence only for logged-out rendering at the time it ran. Customer authentication, account data, checkout, and admin access now use Firebase Authentication and server-side Firestore operations. No production data import or live Firebase connectivity was verified by this run. Wishlist storage/page and legal policy pages are not implemented. Those routes intentionally return the branded 404; add real content and storage before linking them as available features.

## Page and viewport results

| # | Page | Viewport | Category | Severity | Description | Screenshot | Status |
|---:|---|---|---|---|---|---|---|
| 1 | Home | mobile-375x667 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum / Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum / HTTP 400 media.istockphoto.com/id/1332847350/photo/%E2%80%A620&c=85fe0KJzvJFwULQSmkLfQoGkbVur_NzygqSCIf1hs_4= | [Screenshot](./screenshots/home-mobile-375x667.png) | Fail |
| 2 | Search | mobile-375x667 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum | [Screenshot](./screenshots/search-mobile-375x667.png) | Fail |
| 3 | Search no results | mobile-375x667 | Rendering | — | HTTP 200; rendered at /search?q=not-a-real-jewellery-piece; no high-severity visual/runtime findings. | [Screenshot](./screenshots/search-no-results-mobile-375x667.png) | Pass |
| 4 | Category jhumkas | mobile-375x667 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum | [Screenshot](./screenshots/category-jhumkas-mobile-375x667.png) | Fail |
| 5 | Category bridal sets | mobile-375x667 | Rendering | — | HTTP 200; rendered at /categories/bridal-sets; no high-severity visual/runtime findings. | [Screenshot](./screenshots/category-bridal-sets-mobile-375x667.png) | Pass |
| 6 | Product detail | mobile-375x667 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum | [Screenshot](./screenshots/product-detail-mobile-375x667.png) | Fail |
| 7 | Collection festive | mobile-375x667 | Rendering | — | HTTP 200; rendered at /collections/festive-glow; no high-severity visual/runtime findings. | [Screenshot](./screenshots/collection-festive-mobile-375x667.png) | Pass |
| 8 | Collection bridal | mobile-375x667 | Rendering | — | HTTP 200; rendered at /collections/bridal-edit; no high-severity visual/runtime findings. | [Screenshot](./screenshots/collection-bridal-mobile-375x667.png) | Pass |
| 9 | Occasion bridal | mobile-375x667 | Rendering | — | HTTP 200; rendered at /occasion/bridal; no high-severity visual/runtime findings. | [Screenshot](./screenshots/occasion-bridal-mobile-375x667.png) | Pass |
| 10 | Budget under 1500 | mobile-375x667 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum / HTTP 400 media.istockphoto.com/id/1332847350/photo/%E2%80%A620&c=85fe0KJzvJFwULQSmkLfQoGkbVur_NzygqSCIf1hs_4= | [Screenshot](./screenshots/budget-under-1500-mobile-375x667.png) | Fail |
| 11 | Cart | mobile-375x667 | Rendering | — | HTTP 200; rendered at /cart; no high-severity visual/runtime findings. | [Screenshot](./screenshots/cart-mobile-375x667.png) | Pass |
| 12 | Checkout | mobile-375x667 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Fcheckout; no high-severity visual/runtime findings. | [Screenshot](./screenshots/checkout-mobile-375x667.png) | Pass |
| 13 | Payment result | mobile-375x667 | Rendering | — | HTTP 200; rendered at /checkout/payment-result; no high-severity visual/runtime findings. | [Screenshot](./screenshots/payment-result-mobile-375x667.png) | Pass |
| 14 | Login | mobile-375x667 | Rendering | — | HTTP 200; rendered at /login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/login-mobile-375x667.png) | Pass |
| 15 | Register | mobile-375x667 | Rendering | — | HTTP 200; rendered at /register; no high-severity visual/runtime findings. | [Screenshot](./screenshots/register-mobile-375x667.png) | Pass |
| 16 | Forgot password | mobile-375x667 | Rendering | — | HTTP 200; rendered at /forgot-password; no high-severity visual/runtime findings. | [Screenshot](./screenshots/forgot-password-mobile-375x667.png) | Pass |
| 17 | Reset password | mobile-375x667 | Rendering | — | HTTP 200; rendered at /reset-password?error=INVALID_TOKEN; no high-severity visual/runtime findings. | [Screenshot](./screenshots/reset-password-mobile-375x667.png) | Pass |
| 18 | Account overview | mobile-375x667 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Faccount; no high-severity visual/runtime findings. | [Screenshot](./screenshots/account-overview-mobile-375x667.png) | Pass |
| 19 | Account addresses | mobile-375x667 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Faccount%2Faddresses; no high-severity visual/runtime findings. | [Screenshot](./screenshots/account-addresses-mobile-375x667.png) | Pass |
| 20 | Account orders | mobile-375x667 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Faccount%2Forders; no high-severity visual/runtime findings. | [Screenshot](./screenshots/account-orders-mobile-375x667.png) | Pass |
| 21 | Admin login | mobile-375x667 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-login-mobile-375x667.png) | Pass |
| 22 | Admin dashboard | mobile-375x667 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-dashboard-mobile-375x667.png) | Pass |
| 23 | Admin orders | mobile-375x667 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-orders-mobile-375x667.png) | Pass |
| 24 | Admin order detail | mobile-375x667 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-order-detail-mobile-375x667.png) | Pass |
| 25 | Design system | mobile-375x667 | Rendering | — | HTTP 200; rendered at /design-system; no high-severity visual/runtime findings. | [Screenshot](./screenshots/design-system-mobile-375x667.png) | Pass |
| 26 | Wishlist (not implemented) | mobile-375x667 | Rendering | — | HTTP 404; rendered at /wishlist; no high-severity visual/runtime findings. | [Screenshot](./screenshots/wishlist-not-implemented-mobile-375x667.png) | Expected 404 |
| 27 | Privacy policy (not implemented) | mobile-375x667 | Rendering | — | HTTP 404; rendered at /privacy; no high-severity visual/runtime findings. | [Screenshot](./screenshots/privacy-policy-not-implemented-mobile-375x667.png) | Expected 404 |
| 28 | Terms (not implemented) | mobile-375x667 | Rendering | — | HTTP 404; rendered at /terms; no high-severity visual/runtime findings. | [Screenshot](./screenshots/terms-not-implemented-mobile-375x667.png) | Expected 404 |
| 29 | Shipping policy (not implemented) | mobile-375x667 | Rendering | — | HTTP 404; rendered at /shipping-policy; no high-severity visual/runtime findings. | [Screenshot](./screenshots/shipping-policy-not-implemented-mobile-375x667.png) | Expected 404 |
| 30 | 404 | mobile-375x667 | Rendering | — | HTTP 404; rendered at /this-page-does-not-exist; no high-severity visual/runtime findings. | [Screenshot](./screenshots/404-mobile-375x667.png) | Expected 404 |
| 31 | Home | tablet-768x1024 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum / HTTP 400 media.istockphoto.com/id/1332847350/photo/%E2%80%A620&c=85fe0KJzvJFwULQSmkLfQoGkbVur_NzygqSCIf1hs_4= / Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum | [Screenshot](./screenshots/home-tablet-768x1024.png) | Fail |
| 32 | Search | tablet-768x1024 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum | [Screenshot](./screenshots/search-tablet-768x1024.png) | Fail |
| 33 | Search no results | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /search?q=not-a-real-jewellery-piece; no high-severity visual/runtime findings. | [Screenshot](./screenshots/search-no-results-tablet-768x1024.png) | Pass |
| 34 | Category jhumkas | tablet-768x1024 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum | [Screenshot](./screenshots/category-jhumkas-tablet-768x1024.png) | Fail |
| 35 | Category bridal sets | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /categories/bridal-sets; no high-severity visual/runtime findings. | [Screenshot](./screenshots/category-bridal-sets-tablet-768x1024.png) | Pass |
| 36 | Product detail | tablet-768x1024 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum | [Screenshot](./screenshots/product-detail-tablet-768x1024.png) | Fail |
| 37 | Collection festive | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /collections/festive-glow; no high-severity visual/runtime findings. | [Screenshot](./screenshots/collection-festive-tablet-768x1024.png) | Pass |
| 38 | Collection bridal | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /collections/bridal-edit; no high-severity visual/runtime findings. | [Screenshot](./screenshots/collection-bridal-tablet-768x1024.png) | Pass |
| 39 | Occasion bridal | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /occasion/bridal; no high-severity visual/runtime findings. | [Screenshot](./screenshots/occasion-bridal-tablet-768x1024.png) | Pass |
| 40 | Budget under 1500 | tablet-768x1024 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum / HTTP 400 media.istockphoto.com/id/1332847350/photo/%E2%80%A620&c=85fe0KJzvJFwULQSmkLfQoGkbVur_NzygqSCIf1hs_4= | [Screenshot](./screenshots/budget-under-1500-tablet-768x1024.png) | Fail |
| 41 | Cart | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /cart; no high-severity visual/runtime findings. | [Screenshot](./screenshots/cart-tablet-768x1024.png) | Pass |
| 42 | Checkout | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Fcheckout; no high-severity visual/runtime findings. | [Screenshot](./screenshots/checkout-tablet-768x1024.png) | Pass |
| 43 | Payment result | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /checkout/payment-result; no high-severity visual/runtime findings. | [Screenshot](./screenshots/payment-result-tablet-768x1024.png) | Pass |
| 44 | Login | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/login-tablet-768x1024.png) | Pass |
| 45 | Register | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /register; no high-severity visual/runtime findings. | [Screenshot](./screenshots/register-tablet-768x1024.png) | Pass |
| 46 | Forgot password | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /forgot-password; no high-severity visual/runtime findings. | [Screenshot](./screenshots/forgot-password-tablet-768x1024.png) | Pass |
| 47 | Reset password | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /reset-password?error=INVALID_TOKEN; no high-severity visual/runtime findings. | [Screenshot](./screenshots/reset-password-tablet-768x1024.png) | Pass |
| 48 | Account overview | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Faccount; no high-severity visual/runtime findings. | [Screenshot](./screenshots/account-overview-tablet-768x1024.png) | Pass |
| 49 | Account addresses | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Faccount%2Faddresses; no high-severity visual/runtime findings. | [Screenshot](./screenshots/account-addresses-tablet-768x1024.png) | Pass |
| 50 | Account orders | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Faccount%2Forders; no high-severity visual/runtime findings. | [Screenshot](./screenshots/account-orders-tablet-768x1024.png) | Pass |
| 51 | Admin login | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-login-tablet-768x1024.png) | Pass |
| 52 | Admin dashboard | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-dashboard-tablet-768x1024.png) | Pass |
| 53 | Admin orders | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-orders-tablet-768x1024.png) | Pass |
| 54 | Admin order detail | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-order-detail-tablet-768x1024.png) | Pass |
| 55 | Design system | tablet-768x1024 | Rendering | — | HTTP 200; rendered at /design-system; no high-severity visual/runtime findings. | [Screenshot](./screenshots/design-system-tablet-768x1024.png) | Pass |
| 56 | Wishlist (not implemented) | tablet-768x1024 | Rendering | — | HTTP 404; rendered at /wishlist; no high-severity visual/runtime findings. | [Screenshot](./screenshots/wishlist-not-implemented-tablet-768x1024.png) | Expected 404 |
| 57 | Privacy policy (not implemented) | tablet-768x1024 | Rendering | — | HTTP 404; rendered at /privacy; no high-severity visual/runtime findings. | [Screenshot](./screenshots/privacy-policy-not-implemented-tablet-768x1024.png) | Expected 404 |
| 58 | Terms (not implemented) | tablet-768x1024 | Rendering | — | HTTP 404; rendered at /terms; no high-severity visual/runtime findings. | [Screenshot](./screenshots/terms-not-implemented-tablet-768x1024.png) | Expected 404 |
| 59 | Shipping policy (not implemented) | tablet-768x1024 | Rendering | — | HTTP 404; rendered at /shipping-policy; no high-severity visual/runtime findings. | [Screenshot](./screenshots/shipping-policy-not-implemented-tablet-768x1024.png) | Expected 404 |
| 60 | 404 | tablet-768x1024 | Rendering | — | HTTP 404; rendered at /this-page-does-not-exist; no high-severity visual/runtime findings. | [Screenshot](./screenshots/404-tablet-768x1024.png) | Expected 404 |
| 61 | Home | laptop-1280x800 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum / Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum / HTTP 400 media.istockphoto.com/id/1332847350/photo/%E2%80%A620&c=85fe0KJzvJFwULQSmkLfQoGkbVur_NzygqSCIf1hs_4= | [Screenshot](./screenshots/home-laptop-1280x800.png) | Fail |
| 62 | Search | laptop-1280x800 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum | [Screenshot](./screenshots/search-laptop-1280x800.png) | Fail |
| 63 | Search no results | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /search?q=not-a-real-jewellery-piece; no high-severity visual/runtime findings. | [Screenshot](./screenshots/search-no-results-laptop-1280x800.png) | Pass |
| 64 | Category jhumkas | laptop-1280x800 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum | [Screenshot](./screenshots/category-jhumkas-laptop-1280x800.png) | Fail |
| 65 | Category bridal sets | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /categories/bridal-sets; no high-severity visual/runtime findings. | [Screenshot](./screenshots/category-bridal-sets-laptop-1280x800.png) | Pass |
| 66 | Product detail | laptop-1280x800 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum | [Screenshot](./screenshots/product-detail-laptop-1280x800.png) | Fail |
| 67 | Collection festive | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /collections/festive-glow; no high-severity visual/runtime findings. | [Screenshot](./screenshots/collection-festive-laptop-1280x800.png) | Pass |
| 68 | Collection bridal | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /collections/bridal-edit; no high-severity visual/runtime findings. | [Screenshot](./screenshots/collection-bridal-laptop-1280x800.png) | Pass |
| 69 | Occasion bridal | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /occasion/bridal; no high-severity visual/runtime findings. | [Screenshot](./screenshots/occasion-bridal-laptop-1280x800.png) | Pass |
| 70 | Budget under 1500 | laptop-1280x800 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum / HTTP 400 media.istockphoto.com/id/1332847350/photo/%E2%80%A620&c=85fe0KJzvJFwULQSmkLfQoGkbVur_NzygqSCIf1hs_4= | [Screenshot](./screenshots/budget-under-1500-laptop-1280x800.png) | Fail |
| 71 | Cart | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /cart; no high-severity visual/runtime findings. | [Screenshot](./screenshots/cart-laptop-1280x800.png) | Pass |
| 72 | Checkout | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Fcheckout; no high-severity visual/runtime findings. | [Screenshot](./screenshots/checkout-laptop-1280x800.png) | Pass |
| 73 | Payment result | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /checkout/payment-result; no high-severity visual/runtime findings. | [Screenshot](./screenshots/payment-result-laptop-1280x800.png) | Pass |
| 74 | Login | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/login-laptop-1280x800.png) | Pass |
| 75 | Register | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /register; no high-severity visual/runtime findings. | [Screenshot](./screenshots/register-laptop-1280x800.png) | Pass |
| 76 | Forgot password | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /forgot-password; no high-severity visual/runtime findings. | [Screenshot](./screenshots/forgot-password-laptop-1280x800.png) | Pass |
| 77 | Reset password | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /reset-password?error=INVALID_TOKEN; no high-severity visual/runtime findings. | [Screenshot](./screenshots/reset-password-laptop-1280x800.png) | Pass |
| 78 | Account overview | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Faccount; no high-severity visual/runtime findings. | [Screenshot](./screenshots/account-overview-laptop-1280x800.png) | Pass |
| 79 | Account addresses | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Faccount%2Faddresses; no high-severity visual/runtime findings. | [Screenshot](./screenshots/account-addresses-laptop-1280x800.png) | Pass |
| 80 | Account orders | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Faccount%2Forders; no high-severity visual/runtime findings. | [Screenshot](./screenshots/account-orders-laptop-1280x800.png) | Pass |
| 81 | Admin login | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-login-laptop-1280x800.png) | Pass |
| 82 | Admin dashboard | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-dashboard-laptop-1280x800.png) | Pass |
| 83 | Admin orders | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-orders-laptop-1280x800.png) | Pass |
| 84 | Admin order detail | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-order-detail-laptop-1280x800.png) | Pass |
| 85 | Design system | laptop-1280x800 | Rendering | — | HTTP 200; rendered at /design-system; no high-severity visual/runtime findings. | [Screenshot](./screenshots/design-system-laptop-1280x800.png) | Pass |
| 86 | Wishlist (not implemented) | laptop-1280x800 | Rendering | — | HTTP 404; rendered at /wishlist; no high-severity visual/runtime findings. | [Screenshot](./screenshots/wishlist-not-implemented-laptop-1280x800.png) | Expected 404 |
| 87 | Privacy policy (not implemented) | laptop-1280x800 | Rendering | — | HTTP 404; rendered at /privacy; no high-severity visual/runtime findings. | [Screenshot](./screenshots/privacy-policy-not-implemented-laptop-1280x800.png) | Expected 404 |
| 88 | Terms (not implemented) | laptop-1280x800 | Rendering | — | HTTP 404; rendered at /terms; no high-severity visual/runtime findings. | [Screenshot](./screenshots/terms-not-implemented-laptop-1280x800.png) | Expected 404 |
| 89 | Shipping policy (not implemented) | laptop-1280x800 | Rendering | — | HTTP 404; rendered at /shipping-policy; no high-severity visual/runtime findings. | [Screenshot](./screenshots/shipping-policy-not-implemented-laptop-1280x800.png) | Expected 404 |
| 90 | 404 | laptop-1280x800 | Rendering | — | HTTP 404; rendered at /this-page-does-not-exist; no high-severity visual/runtime findings. | [Screenshot](./screenshots/404-laptop-1280x800.png) | Expected 404 |
| 91 | Home | desktop-1920x1080 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum / HTTP 400 media.istockphoto.com/id/1332847350/photo/%E2%80%A620&c=85fe0KJzvJFwULQSmkLfQoGkbVur_NzygqSCIf1hs_4= / Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum | [Screenshot](./screenshots/home-desktop-1920x1080.png) | Fail |
| 92 | Search | desktop-1920x1080 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum | [Screenshot](./screenshots/search-desktop-1920x1080.png) | Fail |
| 93 | Search no results | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /search?q=not-a-real-jewellery-piece; no high-severity visual/runtime findings. | [Screenshot](./screenshots/search-no-results-desktop-1920x1080.png) | Pass |
| 94 | Category jhumkas | desktop-1920x1080 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum | [Screenshot](./screenshots/category-jhumkas-desktop-1920x1080.png) | Fail |
| 95 | Category bridal sets | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /categories/bridal-sets; no high-severity visual/runtime findings. | [Screenshot](./screenshots/category-bridal-sets-desktop-1920x1080.png) | Pass |
| 96 | Product detail | desktop-1920x1080 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum | [Screenshot](./screenshots/product-detail-desktop-1920x1080.png) | Fail |
| 97 | Collection festive | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /collections/festive-glow; no high-severity visual/runtime findings. | [Screenshot](./screenshots/collection-festive-desktop-1920x1080.png) | Pass |
| 98 | Collection bridal | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /collections/bridal-edit; no high-severity visual/runtime findings. | [Screenshot](./screenshots/collection-bridal-desktop-1920x1080.png) | Pass |
| 99 | Occasion bridal | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /occasion/bridal; no high-severity visual/runtime findings. | [Screenshot](./screenshots/occasion-bridal-desktop-1920x1080.png) | Pass |
| 100 | Budget under 1500 | desktop-1920x1080 | Rendering / Layout / A11y | Medium | Network failure net::ERR_BLOCKED_BY_ORB kommodo.ai/i/vquWJKPPcggdxU7UzDum / HTTP 400 media.istockphoto.com/id/1332847350/photo/%E2%80%A620&c=85fe0KJzvJFwULQSmkLfQoGkbVur_NzygqSCIf1hs_4= | [Screenshot](./screenshots/budget-under-1500-desktop-1920x1080.png) | Fail |
| 101 | Cart | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /cart; no high-severity visual/runtime findings. | [Screenshot](./screenshots/cart-desktop-1920x1080.png) | Pass |
| 102 | Checkout | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Fcheckout; no high-severity visual/runtime findings. | [Screenshot](./screenshots/checkout-desktop-1920x1080.png) | Pass |
| 103 | Payment result | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /checkout/payment-result; no high-severity visual/runtime findings. | [Screenshot](./screenshots/payment-result-desktop-1920x1080.png) | Pass |
| 104 | Login | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/login-desktop-1920x1080.png) | Pass |
| 105 | Register | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /register; no high-severity visual/runtime findings. | [Screenshot](./screenshots/register-desktop-1920x1080.png) | Pass |
| 106 | Forgot password | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /forgot-password; no high-severity visual/runtime findings. | [Screenshot](./screenshots/forgot-password-desktop-1920x1080.png) | Pass |
| 107 | Reset password | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /reset-password?error=INVALID_TOKEN; no high-severity visual/runtime findings. | [Screenshot](./screenshots/reset-password-desktop-1920x1080.png) | Pass |
| 108 | Account overview | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Faccount; no high-severity visual/runtime findings. | [Screenshot](./screenshots/account-overview-desktop-1920x1080.png) | Pass |
| 109 | Account addresses | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Faccount%2Faddresses; no high-severity visual/runtime findings. | [Screenshot](./screenshots/account-addresses-desktop-1920x1080.png) | Pass |
| 110 | Account orders | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /login?returnTo=%2Faccount%2Forders; no high-severity visual/runtime findings. | [Screenshot](./screenshots/account-orders-desktop-1920x1080.png) | Pass |
| 111 | Admin login | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-login-desktop-1920x1080.png) | Pass |
| 112 | Admin dashboard | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-dashboard-desktop-1920x1080.png) | Pass |
| 113 | Admin orders | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-orders-desktop-1920x1080.png) | Pass |
| 114 | Admin order detail | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /admin/login; no high-severity visual/runtime findings. | [Screenshot](./screenshots/admin-order-detail-desktop-1920x1080.png) | Pass |
| 115 | Design system | desktop-1920x1080 | Rendering | — | HTTP 200; rendered at /design-system; no high-severity visual/runtime findings. | [Screenshot](./screenshots/design-system-desktop-1920x1080.png) | Pass |
| 116 | Wishlist (not implemented) | desktop-1920x1080 | Rendering | — | HTTP 404; rendered at /wishlist; no high-severity visual/runtime findings. | [Screenshot](./screenshots/wishlist-not-implemented-desktop-1920x1080.png) | Expected 404 |
| 117 | Privacy policy (not implemented) | desktop-1920x1080 | Rendering | — | HTTP 404; rendered at /privacy; no high-severity visual/runtime findings. | [Screenshot](./screenshots/privacy-policy-not-implemented-desktop-1920x1080.png) | Expected 404 |
| 118 | Terms (not implemented) | desktop-1920x1080 | Rendering | — | HTTP 404; rendered at /terms; no high-severity visual/runtime findings. | [Screenshot](./screenshots/terms-not-implemented-desktop-1920x1080.png) | Expected 404 |
| 119 | Shipping policy (not implemented) | desktop-1920x1080 | Rendering | — | HTTP 404; rendered at /shipping-policy; no high-severity visual/runtime findings. | [Screenshot](./screenshots/shipping-policy-not-implemented-desktop-1920x1080.png) | Expected 404 |
| 120 | 404 | desktop-1920x1080 | Rendering | — | HTTP 404; rendered at /this-page-does-not-exist; no high-severity visual/runtime findings. | [Screenshot](./screenshots/404-desktop-1920x1080.png) | Expected 404 |

## Summary

- Pages/screens tested: 120
- Failed page/viewport checks: 20
- Screenshots saved under `tests/screenshots/`.
- The route suite checks HTTP response, blank content, visible H1, horizontal overflow, obvious placeholder strings, image loading, browser console/page errors, font loading, sticky header position, and axe critical/serious violations at laptop width.
- Authenticated-only pages were checked in logged-out state. Successful Firebase sign-in, session exchange, checkout completion, online payment, and customer data flows require configured Firebase services and payment credentials.

## Known gaps / suggestions

- Wishlist, privacy, terms, and shipping-policy pages do not exist; legal copy must be supplied rather than invented.
- Firebase customer auth now uses the web config in the ignored `.env.local`; the Firebase Admin service-account JSON is not configured in this workspace.
- Firebase Admin service-account JSON is not configured in this workspace, so server verification and real Firebase sign-in have not been exercised end to end.
- Full cart-to-order, account management, image-backed catalog, and real Google OAuth require Firebase Console provider configuration and a configured Firebase Admin credential.
- Lighthouse measurements are not included in this report until run against a ready server with browser/runtime access; do not treat lab performance targets as achieved without those measurements.

## Manual checks

1. Sign in with a real Google account and verify OAuth callback/authorized domains.
2. Verify a customer session can complete COD checkout and saved-address handling.
3. Verify UroPay sandbox/production redirect behavior with provider credentials.
4. Test touch, screen reader, and browser behavior on physical iOS Safari and Android Chrome.
