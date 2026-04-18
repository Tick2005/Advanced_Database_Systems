import React from 'react';
const Footer = () => (
  <footer style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--color-muted)', fontSize: 13, borderTop: '1px solid var(--color-border)' }}>
    © {new Date().getFullYear()} LuxStay Hotel. All rights reserved.
  </footer>
);
export default Footer;