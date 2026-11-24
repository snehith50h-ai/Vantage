"""Build guidance shared by the team in a hackathon room."""

from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, model_validator

from app.student_plan import BuildStep, Line


TeamRole = Literal["lead", "frontend", "backend", "testing", "demo"]
TaskStatus = Literal["todo", "in_progress", "blocked", "done"]

PLAN_INSTRUCTIONS = (
    "Create a practical, ordered build plan for first-time hackathon students. "
    "Recommend the smallest appropriate stack and explain how data moves through it. "
    "For each AI tool, explain when to use it, give a copyable project-specific first prompt, and say how to check its output. Include Vantage Mentor. "
    "Suggest one role per task, sized for the team. Include observable acceptance criteria and a demo and submission checklist. "
    "Write one separate demo_check for the hardest rule the demo depends on. Include starting data, reproducible actions, "
    "and the exact pass result. Exercise each failure case relevant to that rule, including competing actions if the brief names a race. "
    "Give the demo check a distinct task title. Describe expected behavior without claiming the check ran. "
    "Existing decisions are context. If one conflicts with the brief or rubric, explain a feasible correction."
)


class ToolGuidance(BaseModel):
    tool: Line
    purpose: Line
    first_step: Line


class HackathonStep(BuildStep):
    role: TeamRole


class DemoCheck(BaseModel):
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=180)]
    rule: Line
    setup: Line
    actions: list[Line] = Field(min_length=2, max_length=5)
    expected: Line

    def task_description(self) -> str:
        actions = "\n".join(f"{index}. {action}" for index, action in enumerate(self.actions, 1))
        return f"Rule to prove\n{self.rule}\n\nSetup\n{self.setup}\n\nRun the check\n{actions}"


class HackathonPlan(BaseModel):
    workflow: Line
    scope: list[Line] = Field(min_length=1, max_length=4)
    cuts: list[Line] = Field(min_length=1, max_length=4)
    stack: list[ToolGuidance] = Field(min_length=1, max_length=4)
    architecture: list[Line] = Field(min_length=2, max_length=5)
    ai_tools: list[ToolGuidance] = Field(min_length=2, max_length=4)
    steps: list[HackathonStep] = Field(min_length=3, max_length=8)
    demo: list[Line] = Field(min_length=2, max_length=5)
    submit: list[Line] = Field(min_length=2, max_length=5)
    demo_check: DemoCheck | None = None


class GeneratedHackathonPlan(HackathonPlan):
    """New model output requires a demo check. Previously saved plans are still valid."""

    demo_check: DemoCheck

    @model_validator(mode="after")
    def separate_check_task(self):
        names = {step.task[:180].strip().casefold() for step in self.steps}
        if self.demo_check.title.casefold() in names:
            raise ValueError("Give the demo check a distinct title. It becomes a separate test task.")
        return self


def starter_plan(problem: str) -> HackathonPlan:
    return HackathonPlan(
        workflow="Pick one person from your problem statement. Show their starting input, what they do, and the result they get.",
        scope=["Include one workflow that the team can run from start to finish with realistic sample data."],
        cuts=["Defer extra user types, dashboards and integrations unless the event requires them."],
        stack=[
            ToolGuidance(tool="HTML, CSS and JavaScript", purpose="Build the smallest working web demo.",
                         first_step="Use this default if a browser fits your idea. Make one screen with a sample input and an output area."),
            ToolGuidance(tool="Git and GitHub", purpose="Share changes and review each other’s work.",
                         first_step="Clone the team repository and open a pull request for a small README improvement."),
        ],
        architecture=[
            "The demo screen collects one input and passes it to a function implementing the main workflow.",
            "Start with sample data in the app. Return the result to the screen with a clear error message for invalid input.",
            "Add a server or database only if the main workflow needs shared storage or a server-side secret.",
        ],
        ai_tools=[
            ToolGuidance(tool="Vantage Mentor", purpose="Break the problem into a first task you can test.",
                         first_step=f"Ask: ‘For this project, propose one input, action and result I can demo with sample data: {problem[:155]}’"),
            ToolGuidance(tool="GitHub Copilot or a chat assistant you already have", purpose="Explain unfamiliar code and suggest small changes.",
                         first_step="Ask it to explain a single function, propose one test, and tell you how to run that test. Try it yourself before committing."),
        ],
        steps=[
            HackathonStep(task="Agree on an example for your demo", role="lead",
                          done_when="The README shows a sample input, what the user does and the expected result."),
            HackathonStep(task="Build the demo screen", role="frontend",
                          done_when="A teammate can enter the sample input and see where the result appears."),
            HackathonStep(task="Implement the main workflow", role="backend",
                          done_when="The screen shows a correct result for the sample input and handles an invalid input."),
            HackathonStep(task="Run and record a teammate’s test", role="testing",
                          done_when="Someone else can follow the README and record the result in Vantage."),
            HackathonStep(task="Rehearse and package the demo", role="demo",
                          done_when="The team has rehearsed once and checked the required submission links."),
        ],
        demo=["Explain who has the problem and show their starting input.", "Run the workflow and point to the result that solves the problem."],
        submit=["Add setup steps, sample data and known limits to the README.", "Check the organizer’s required links, format and deadline."],
    )
