import { Container } from "./Container";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  background?: "default" | "accent" | "primary";
  padding?: "default" | "large";
  containerized?: boolean;
}

export function Section({ 
  children, 
  className = "", 
  background = "default",
  padding = "default",
  containerized = true
}: SectionProps) {
  const backgroundClasses = {
    default: "",
    accent: "bg-accent/30 dark:bg-gray-800/30",
    primary: "bg-primary text-primary-foreground"
  };

  const paddingClasses = {
    default: "py-8",
    large: "py-16"
  };

  const sectionClasses = `${backgroundClasses[background]} ${paddingClasses[padding]} ${className}`;

  if (containerized) {
    return (
      <section className={sectionClasses}>
        <Container>
          {children}
        </Container>
      </section>
    );
  }

  return (
    <section className={sectionClasses}>
      {children}
    </section>
  );
}
