import { SITE } from "@/lib/site";
import { PageHeader, Section, card } from "@/components/section";
import Button from "@/components/ui/button";
import StartProjectForm from "@/components/start-project-form";

export const metadata = {
  title: "Start a Project",
  description: "Initiate a project discussion with BytecCloud. Submit your requirements, timeline, and goals for a clear estimate and roadmap.",
};

const subject = encodeURIComponent("New project enquiry");
const body = encodeURIComponent(
  "Hi BytecCloud Team,\n\nWhat we want to build:\nBudget range:\nTarget timeline:\nOur company/website:\n"
);

export default function StartProject() {
  return (
    <>
      <PageHeader
        eyebrow="Start a project"
        title="Tell us what you want to build."
        intro="Submit your project brief below, or send us a direct email with your specifications."
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <div className={card}>
              <h2 className="mb-3 text-xl font-semibold tracking-[-0.03em]">Helpful to include</h2>
              <ul className="mb-6 list-disc space-y-2 pl-5 text-sm text-muted">
                <li>What core problem you need to solve</li>
                <li>Who the target users/stakeholders will be</li>
                <li>Rough timeline and budget parameters</li>
                <li>Any existing platforms, data, or APIs</li>
              </ul>
              <div className="border-t border-border pt-4">
                <p className="mb-3 text-xs text-muted">Prefer emailing your brief directly?</p>
                <Button href={`mailto:${SITE.email}?subject=${subject}&body=${body}`} variant="secondary">
                  Email us your brief
                </Button>
              </div>
            </div>

            <div className={`${card} border-accent/30 bg-accent/5`}>
              <h3 className="mb-2 text-base font-semibold text-accent-ink">What happens next?</h3>
              <ol className="list-decimal space-y-1.5 pl-4 text-xs text-muted">
                <li>We review your requirements within 24 hours.</li>
                <li>We schedule a brief 20-minute discovery call.</li>
                <li>We provide an architectural outline and estimate.</li>
              </ol>
            </div>
          </div>

          <div className="lg:col-span-2">
            <StartProjectForm />
          </div>
        </div>
      </Section>
    </>
  );
}
