import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { HelmetProvider } from "react-helmet-async";
import { useEffect } from "react";
import "@/App.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollIntentLeadForm from "@/components/ScrollIntentLeadForm";
import AtomicCursor from "@/components/AtomicCursor";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Projects from "@/pages/Projects";
import Careers from "@/pages/Careers";
import Knowledge from "@/pages/Knowledge";
import Article from "@/pages/Article";
import Contact from "@/pages/Contact";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Admin from "@/pages/Admin";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function Shell() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  return (
    <>
      <ScrollToTop />
      {!isAdmin && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/knowledge/:slug" element={<Article />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <ScrollIntentLeadForm />}
      {!isAdmin && <AtomicCursor />}
    </>
  );
}

function App() {
  return (
    <div className="App" data-testid="app-root">
      <HelmetProvider>
        <BrowserRouter>
          <Shell />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#0a0a0a",
                color: "#fff",
                border: "1px solid #1a1a1a",
                fontFamily: "Outfit, sans-serif",
              },
            }}
          />
        </BrowserRouter>
      </HelmetProvider>
    </div>
  );
}

export default App;
