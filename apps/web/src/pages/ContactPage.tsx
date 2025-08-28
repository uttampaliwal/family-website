import React from "react";
import InfoPageLayout from "../components/InfoPageLayout";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import Button from "../components/Button";

const ContactPage: React.FC = () => {
  return (
    <InfoPageLayout
      title="Contact Us"
      subtitle="We'd love to hear from you. Send us a message and we'll get back to you as soon as possible."
    >
      <form>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="name" className="block text-base font-medium mb-2">
              Name
            </label>
            <Input type="text" id="name" name="name" placeholder="Your Name" />
          </div>
          <div>
            <label htmlFor="email" className="block text-base font-medium mb-2">
              Email
            </label>
            <Input
              type="email"
              id="email"
              name="email"
              placeholder="Your Email"
            />
          </div>
        </div>
        <div className="mb-6">
          <label htmlFor="subject" className="block text-base font-medium mb-2">
            Subject
          </label>
          <Input
            type="text"
            id="subject"
            name="subject"
            placeholder="Subject of your message"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="message" className="block text-base font-medium mb-2">
            Message
          </label>
          <Textarea
            id="message"
            name="message"
            rows={6}
            placeholder="Your message..."
          />
        </div>
        <div className="text-right">
          <Button type="submit" variant="primary">
            Send Message
          </Button>
        </div>
      </form>
    </InfoPageLayout>
  );
};

export default ContactPage;
