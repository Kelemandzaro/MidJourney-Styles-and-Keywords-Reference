interface Props {
  onStart: () => void;
}

export default function Landing({ onStart }: Props) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="toolbar-logo">&#9632;</span>
        <span className="toolbar-name" style={{ color: '#1B2A6B', fontSize: 18 }}>FormCraft</span>
      </nav>

      <section className="landing-hero">
        <div className="landing-badge">Visual PDF Form Builder</div>
        <h1 className="landing-title">
          Build beautiful,<br />
          <span style={{ color: '#C9A227' }}>fillable PDF forms</span>
        </h1>
        <p className="landing-sub">
          Drag &amp; drop elements, design pixel-perfect layouts, and export
          real fillable PDFs — with 100% WYSIWYG fidelity.
        </p>
        <button className="landing-cta" onClick={onStart}>
          Start Building →
        </button>
      </section>

      <section className="landing-features">
        <FeatureCard
          icon="🎯"
          title="True WYSIWYG"
          desc="Every pixel you see in the editor is exactly what lands in your PDF. No surprises."
        />
        <FeatureCard
          icon="📝"
          title="Real Fillable Fields"
          desc="Text fields, date pickers, dropdowns, signatures — all embedded as native AcroForm widgets."
        />
        <FeatureCard
          icon="⚡"
          title="Drag & Drop Builder"
          desc="Dozens of pre-built elements, smart snap-to-grid, and instant property editing."
        />
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  );
}
