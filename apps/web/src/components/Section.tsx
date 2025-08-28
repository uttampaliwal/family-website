import React from "react";

interface SectionProps {
  title: string;
  number: number;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, number, children }) => {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-base mb-4 flex items-center">
        <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary text-sm font-bold mr-3">
          {number}
        </span>
        {title}
      </h2>
      <div className="ml-11">{children}</div>
    </section>
  );
};

export default Section;
