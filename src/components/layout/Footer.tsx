import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-[1140px] mx-auto px-5 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
              <span>✈️ Flight Price Intelligence</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Real-time airline competitor airfare monitoring, proximity benchmarking, and OTA rate parity auditing.
              Extracting competitor yield curves and fare differences across domestic and international flight corridors.
            </p>
            <p className="text-slate-500 text-xs mt-3">
              Developed by Gramosoft Private Limited · Chennai, India.
            </p>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Popular Corridors</h4>
            <ul className="space-y-2 text-xs list-none p-0 m-0">
              <li>Chennai (MAA) → Dubai (DXB)</li>
              <li>Delhi (DEL) → Mumbai (BOM)</li>
              <li>Bengaluru (BLR) → Singapore (SIN)</li>
              <li>Mumbai (BOM) → London (LHR)</li>
              <li>Delhi (DEL) → New York (JFK)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Solutions</h4>
            <ul className="space-y-2 text-xs list-none p-0 m-0">
              <li><a href="#live-demo" className="text-slate-400 hover:text-white transition-colors no-underline">Live Price Check</a></li>
              <li><a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors no-underline">How It Works</a></li>
              <li><a href="#features" className="text-slate-400 hover:text-white transition-colors no-underline">Features</a></li>
              <li><a href="#faq" className="text-slate-400 hover:text-white transition-colors no-underline">Frequently Asked Questions</a></li>
              <li><a href="mailto:rajeshm@gramosoft.in" className="text-slate-400 hover:text-white transition-colors no-underline">Contact Enterprise Support</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="m-0">
            © {new Date().getFullYear()} Gramosoft Private Limited. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span>ISO 9001 & ISO 27001 Certified</span>
            <a href="mailto:rajeshm@gramosoft.in" className="text-slate-500 hover:text-slate-400 no-underline">
              rajeshm@gramosoft.in
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
