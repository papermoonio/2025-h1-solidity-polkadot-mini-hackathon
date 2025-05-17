import React from 'react';

interface LegalItem {
  id: number;
  content: string;
}

interface LegalSectionProps {
  title: string;
  items: LegalItem[];
}

const LegalSection: React.FC<LegalSectionProps> = ({ title, items }) => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="p-4 bg-white rounded-lg shadow-sm">
            <p className="text-gray-700">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LegalSection;