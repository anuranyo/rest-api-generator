import { motion } from "framer-motion";

const features = [
  {
    title: "1. Define DB Schema",
    desc: "Paste or upload your JSON-based DB model."
  },
  {
    title: "2. Auto Generate API",
    desc: "Receive a complete REST API project instantly."
  },
  {
    title: "3. Test & Download",
    desc: "Play with a mock DB and download your code as ZIP."
  }
];

export default function FeatureSteps() {
  return (
    <section className="py-20 bg-white" id="generate">
      <div className="max-w-6xl mx-auto px-6">
        <h3 className="text-3xl font-bold mb-12 text-center text-gray-900">
          What You Can Do
        </h3>
        <div className="grid md:grid-cols-3 gap-10">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              viewport={{ once: true }}
              className="bg-gray-50 p-6 rounded-2xl shadow hover:shadow-lg transition-all"
            >
              <h4 className="text-xl font-semibold text-gray-800 mb-2">
                {feature.title}
              </h4>
              <p className="text-gray-600 text-base leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
