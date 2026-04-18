import React from 'react';
const Contact = () => (
  <div style={{maxWidth:800,margin:'60px auto',padding:'0 24px'}}>
    <h1 style={{fontFamily:'var(--font-display)',fontSize:32,marginBottom:24}}>Liên hệ</h1>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:24}}>
      {[['📞','Hotline','1800 6789'],['📧','Email','support@luxstay.vn'],['📍','Địa chỉ','123 Lê Lợi, Q1, TP.HCM']].map(([icon,label,val]) => (
        <div key={label} style={{background:'#fff',borderRadius:'var(--radius-md)',padding:24,boxShadow:'var(--shadow-soft)'}}>
          <div style={{fontSize:32,marginBottom:8}}>{icon}</div>
          <div style={{fontWeight:600,marginBottom:4}}>{label}</div>
          <div style={{color:'var(--color-muted)',fontSize:14}}>{val}</div>
        </div>
      ))}
    </div>
  </div>
);
export default Contact;
