// ResourceRelations.jsx
import { useState } from "react";

const initialResources = [
  { name: "users", parent: null },
  { name: "posts", parent: null },
  { name: "comments", parent: null },
  { name: "likes", parent: null }
];

export default function ResourceRelations() {
  const [resources, setResources] = useState(initialResources);

  const handleParentChange = (child, newParent) => {
    setResources((prev) =>
      prev.map((node) =>
        node.name === child ? { ...node, parent: node.parent === newParent ? null : newParent } : node
      )
    );
  };

  const buildTree = () => {
    const map = new Map();
    resources.forEach((node) => (map[node.name] = { ...node, children: [] }));
    const roots = [];

    for (const node of resources) {
      if (node.parent && map[node.parent]) {
        map[node.parent].children.push(map[node.name]);
      } else {
        roots.push(map[node.name]);
      }
    }
    return roots;
  };

  const generatePaths = (node, base = "") => {
    const path = `${base}/${node.name}/{${node.name.slice(0, -1)}Id}`;
    const paths = [path];
    node.children.forEach((child) => {
      paths.push(...generatePaths(child, path));
    });
    return paths;
  };

  const treeRoots = buildTree();

  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-6 grid gap-12">
        <div className="grid gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Relations between resources</h1>
          <p className="text-lg leading-relaxed text-gray-600">
            Setup relations between resources and automatically generate endpoints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Tree View */}
          <div className="relative before:block before:absolute before:rounded-xl before:opacity-30 before:-inset-1 before:-skew-y-3 before:scale-110 before:rotate-[-6deg] before:bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            <div className="relative rounded-2xl shadow-2xl bg-white p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="uppercase text-xs text-gray-400 font-semibold tracking-widest">
                  Resource Tree
                </h4>
                <button
                  onClick={() => setResources(initialResources)}
                  className="text-sm text-blue-600 hover:text-blue-800 border border-blue-500 px-3 py-1 rounded-md transition"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-3">
                {resources.map((res) => (
                  <div
                    key={res.name}
                    className="bg-gray-100 px-4 py-3 rounded-xl shadow-sm"
                  >
                    <div className="font-mono text-sm mb-3 text-gray-700">{res.name} belongs to:</div>
                    <div className="flex flex-wrap gap-2">
                      {resources
                        .filter((r) => r.name !== res.name)
                        .map((option) => (
                          <button
                            key={option.name}
                            onClick={() => handleParentChange(res.name, option.name)}
                            className={`px-3 py-1 text-sm rounded-full border transition ${
                              res.parent === option.name
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-200"
                            }`}
                          >
                            {option.name}
                          </button>
                        ))}
                      <button
                        onClick={() => handleParentChange(res.name, null)}
                        className={`px-3 py-1 text-sm rounded-full border transition ${
                          res.parent === null
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        None
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-6 pt-6">
            <h4 className="uppercase text-xs text-gray-400 font-bold tracking-widest">
              Generated Endpoints
            </h4>
            <div className="grid gap-2">
              {treeRoots.flatMap((n) => generatePaths(n)).map((ep, i) => (
                <div
                  key={i}
                  className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md font-mono text-sm shadow"
                >
                  <code>{ep}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
