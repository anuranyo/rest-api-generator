import { useState } from "react";

const fakerTypes = [
  "address.city", "address.country", "internet.email", "name.fullName",
  "image.avatar", "date.recent", "address.buildingNumber"
];

export default function SimpleDataModeling() {
  const [fields, setFields] = useState([
    { name: "createdAt", generator: "Faker.js", type: "date.recent" },
    { name: "name", generator: "Faker.js", type: "name.fullName" },
    { name: "avatar", generator: "Faker.js", type: "image.avatar" }
  ]);

  const [dropdownIndex, setDropdownIndex] = useState(null);

  const handleTypeSelect = (i, value) => {
    const updated = [...fields];
    updated[i].type = value;
    setFields(updated);
    setDropdownIndex(null);
  };

  const handleAddField = () => {
    const newFieldName = `field${fields.length + 1}`;
    setFields([
      ...fields,
      { name: newFieldName, generator: "Faker.js", type: fakerTypes[0] }
    ]);
  };

  const handleNameChange = (i, value) => {
    const updated = [...fields];
    updated[i].name = value;
    setFields(updated);
  };

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-8 gap-8">
        <div className="col-span-3 self-center space-y-4">
          <h2 className="text-2xl font-bold">Simple data modeling</h2>
          <p className="text-gray-700 text-lg">
            Define resource schema and data generators for each field
          </p>
        </div>

        <div className="col-span-5 relative before:block before:absolute before:rounded-xl before:opacity-40 before:-inset-1 before:-skew-y-3 before:scale-110 before:rotate-6 before:bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
          <div className="relative bg-white shadow-xl rounded-2xl p-6 space-y-4 z-10 overflow-visible">
            <h4 className="uppercase text-xs text-gray-400 font-bold tracking-wider">
              Resource schema
            </h4>

            {/* ID field */}
            <div className="grid grid-cols-10 gap-2">
              <div className="col-span-3">
                <div className="bg-gray-100 px-3 py-2 rounded-xl font-mono text-sm">id</div>
              </div>
              <div className="col-span-3">
                <div className="bg-gray-100 px-3 py-2 rounded-xl font-mono text-sm">Object ID</div>
              </div>
            </div>

            {/* Field Rows */}
            {fields.map((field, i) => (
              <div key={i} className="grid grid-cols-10 gap-2 items-center relative z-0">
                {/* Field name */}
                <div className="col-span-3">
                  <input
                    value={field.name}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                    className="bg-gray-100 px-3 py-2 rounded-xl font-mono text-sm w-full outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Generator (Faker.js — без dropdown) */}
                <div className="col-span-3">
                  <div className="bg-gray-100 px-3 py-2 rounded-xl font-mono text-sm">
                    Faker.js
                  </div>
                </div>

                {/* Faker type dropdown */}
                <div className="col-span-3 relative z-[101]"> {/* Added z-[101] class here */}
                  <div
                    onClick={() => setDropdownIndex(i)}
                    className="cursor-pointer bg-gray-100 px-3 py-2 rounded-xl font-mono text-sm z-100"
                  >
                    {field.type}
                  </div>
                  {dropdownIndex === i && (
                    <DropdownMenu
                      items={fakerTypes}
                      onSelect={(val) => handleTypeSelect(i, val)}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Add button */}
            <div>
              <button
                onClick={handleAddField}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow z-10 relative"
              >
                <span className="text-lg font-bold">+</span> Add Field
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DropdownMenu({ items, onSelect }) {
  return (
  <div className="absolute top-12 left-0 w-full bg-white border border-gray-200 rounded-xl shadow-md z-auto"> 
      <input
        placeholder="Search..."
        className="w-full px-3 py-2 border-b border-gray-200 outline-none text-sm"
      />
      <ul className="max-h-48 overflow-auto text-sm">
        {items.map((item) => (
          <li
            key={item}
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => onSelect(item)}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}