"use client";

const products = [
  ["Chrome Silver", "The Silver Haus", "silver"],
  ["Satin Gold", "The Gold Haus", "gold"],
];

const steps = [
  "Choose silver, gold, or start with a custom request.",
  "Submit your name, phone, email, ring size and timeline.",
  "We prepare a private quote around finish, size and custom details.",
  "Approve production. Your ring is made to order and shipped.",
];

export default function Home() {
  function submitQuote(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent("Stud Haus private quote request");
    const body = encodeURIComponent(
      `Name: ${data.get("name")}\nEmail: ${data.get("email")}\nPhone: ${data.get("phone")}\nFinish: ${data.get("finish")}\n\nDetails:\n${data.get("details") || ""}`,
    );
    window.location.href = `mailto:quotes@pouchcare.com.au?subject=${subject}&body=${body}`;
  }

  return (
    <main>
      <nav className="nav" aria-label="Primary navigation">
        <a href="#top" className="brand">STUD HAUS</a>
        <div className="nav-links"><a href="#rings">Rings</a><a href="#detail">Detail</a><a href="#process">Process</a><a href="#quote" className="nav-cta">Quote</a></div>
      </nav>
      <section className="hero" id="top">
        <img src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1840&q=88" alt="Man in a black suit with a luxury watch" />
        <div className="hero-shade" />
        <div className="hero-content"><p className="eyebrow">Made-to-order men's diamond bands</p><h1>Wear a Ring With Presence</h1><p className="hero-copy">Smooth 8mm wedding bands with a hidden diamond edge. Built for restraint, status and permanence.</p><div className="hero-actions"><a href="#quote" className="button primary">Request a Quote</a><a href="#rings" className="button ghost">View Rings</a></div></div>
      </section>
      <section className="intro band-light"><div className="section-kicker">Stud Haus</div><h2>Fine jewellery for men who want weight, control and presence.</h2><p>Not a delicate bridal ring. Not a loud diamond flex. Stud Haus is built around a smoother idea of status: masculine form, clean metal, and a diamond detail that stays hidden until the ring is seen from the right angle.</p></section>
      <section className="products" id="rings"><div className="section-head"><p className="eyebrow">Launch collection</p><h2>Two finishes. One profile.</h2><p>Both rings are made to order with custom sizing and optional personal details quoted before production.</p></div><div className="product-grid">{products.map(([finish,label,tone])=><article className={`product-card ${tone}`} key={finish}><div className="render-stage" aria-hidden="true"><Ring tone={tone}/></div><div className="product-copy"><p>{finish}</p><h3>{label}</h3><span>8mm smooth band</span><p>A made-to-order wide band with a concealed lower-rim diamond line. Clean from above. Clean upright. Revealed only at the right angle.</p><a href="#quote" className="text-link">Enquire about {finish}</a></div></article>)}</div></section>
      <section className="detail" id="detail"><div className="detail-copy"><p className="eyebrow">The hidden edge</p><h2>Seen only when the ring lets it be seen.</h2><p>The main read is a strong, uninterrupted men's band. From the top, no diamonds. Standing upright, no diamonds. Laying flat and viewed low, the diamond line appears tucked into the inner lower rim.</p></div><div className="profile-grid" aria-label="Ring profile explainer"><div className="profile-panel"><span>Top view</span><div className="top-ring silver-ring"/><p>Smooth metal. No diamonds visible.</p></div><div className="profile-panel"><span>Upright</span><div className="side-band silver-band"/><p>Clean outer wall. No side-row diamonds.</p></div><div className="profile-panel active"><span>Flat / low angle</span><div className="low-ring gold-ring"><DiamondLine/></div><p>Hidden lower-rim diamond edge revealed.</p></div></div></section>
      <section className="status-world"><img src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1700&q=88" alt="Black luxury car detail at night"/><div><p className="eyebrow">The world around the ring</p><h2>Status without noise.</h2><p>Date nights. Black cars. Tailored suits. Good watches. Private travel. The brand should feel like the room before the room notices you.</p></div></section>
      <section className="process" id="process"><div className="section-head"><p className="eyebrow">Made to order</p><h2>The form is the checkout.</h2><p>Stud Haus should feel more like a private commission than a standard ecommerce transaction.</p></div><div className="steps">{steps.map((step,index)=><div className="step" key={step}><span>0{index+1}</span><p>{step}</p></div>)}</div></section>
      <section className="trust band-light"><div><p className="eyebrow">Confidence</p><h2>Quote first. Production second.</h2></div><div className="trust-grid"><p>Made-to-order production</p><p>Silver and gold launch finishes</p><p>Custom sizing and engraving</p><p>Hidden diamond lower-rim detail</p><p>Private quote before payment</p><p>Shipping timeline confirmed upfront</p></div></section>
      <section className="quote" id="quote"><div className="quote-copy"><p className="eyebrow">Private quote</p><h2>Build the ring.</h2><p>Leave your details and the Stud Haus team will prepare a quote around your finish, size, timeline and custom requests.</p></div><form className="quote-form" onSubmit={submitQuote}><label>Name<input name="name" autoComplete="name" required/></label><label>Email<input name="email" type="email" autoComplete="email" required/></label><label>Phone<input name="phone" type="tel" autoComplete="tel" required/></label><label>Preferred finish<select name="finish" defaultValue="Chrome Silver"><option>Chrome Silver</option><option>Satin Gold</option><option>Not sure yet</option></select></label><label>Ring size / timeframe / custom details<textarea name="details" rows="5" placeholder="Ring size if known, wedding date, engraving or custom request"/></label><button className="button primary" type="submit">Request Private Quote</button><p className="form-note">Prototype form: this opens a pre-filled quote email until the final inbox or CRM is connected.</p></form></section>
      <footer><strong>STUD HAUS</strong><span>Men's diamond wedding bands. Made to order.</span><a href="#quote">Request a quote</a></footer>
    </main>
  );
}

function Ring({ tone }) {return <div className={`ring-render ${tone}`}><div className="ring-face"/><div className="ring-shadow"/><div className="hidden-diamonds"><DiamondLine/></div></div>;}
function DiamondLine(){return Array.from({length:18},(_,index)=><i key={index}/>);}
