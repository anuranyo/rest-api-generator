import { motion } from "framer-motion";

export default function PricingPlans() {
  const plans = [
    {
      name: 'Free',
      price: 'Free',
      projects: 1,
      resources: 2,
      custom: false,
      collab: false
    },
    {
      name: '$5',
      sub: '/month',
      price: '$5/month',
      projects: 20,
      resources: 50,
      custom: true,
      collab: true
    },
    {
      name: '$35',
      sub: '/year',
      price: '$35/year',
      projects: 20,
      resources: 50,
      custom: true,
      collab: true
    }
  ];

  return (
    <section className="bg-white py-28">
      <div className="max-w-7xl mx-auto px-6">
        <motion.h3
          className="text-4xl font-extrabold mb-16 text-center text-gray-900"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Pricing
        </motion.h3>

        <div className="grid md:grid-cols-3 gap-10">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              className="bg-white shadow-xl rounded-2xl p-8 text-base space-y-5 border hover:shadow-2xl transition duration-300"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h4 className="text-2xl font-bold text-gray-800">
                {plan.name}
                {plan.sub && <span className="text-base font-normal">{plan.sub}</span>}
              </h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex justify-between">
                  <span>Projects</span>
                  <span className="font-semibold">{plan.projects}</span>
                </li>
                <li className="flex justify-between">
                  <span>Resources</span>
                  <span className="font-semibold">{plan.resources}</span>
                </li>
                <li className="flex justify-between">
                  <span>Custom response</span>
                  <span className="text-lg">{plan.custom ? '✅' : '❌'}</span>
                </li>
                <li className="flex justify-between">
                  <span>Collaboration</span>
                  <span className="text-lg">{plan.collab ? '✅' : '❌'}</span>
                </li>
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
