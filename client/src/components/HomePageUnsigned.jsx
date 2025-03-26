import SimpleDataModeling from "./Landing/SimpleDataModeling";
import ResourceRelations from "./Landing/ResourceRelations";
import FeatureSteps from "./Landing/FeatureSteps";
import Header from "./Landing/Header";
import Hero from "./Landing/Hero";
import PricingPlans from "./Landing/PricingPlans";
import Drag from "./Landing/Drag";

export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Drag />

      <Header /> 
      <Hero />
      <PricingPlans />

      {/* Main content */}

      <FeatureSteps />
      <SimpleDataModeling />
      <ResourceRelations />

      {/* Footer */}
      <footer className="bg-gray-100 text-center text-sm text-gray-500 py-6 border-t">
        &copy; 2025 REST API Generator. Built for developers.
      </footer>
    </div>
  );
}
