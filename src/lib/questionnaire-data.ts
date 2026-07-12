export interface Question {
  id: string;
  text: string;
  options: string[];
}

export const QUESTIONNAIRE_QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "You've reached the end of your shift. One child is still waiting to be picked up.",
    options: [
      "A. Leave quietly. They'll probably adopt the security guard.",
      "B. Wait with the child and hope they enjoy your jokes.",
      "C. Inform your supervisor, stay with the child and complete the incident log.",
      "D. Put them in Lost Property."
    ]
  },
  {
    id: "q2",
    text: "A child falls over dramatically… then looks around to see if anyone noticed.",
    options: [
      "A. Award them an Oscar.",
      "B. Check they're okay before deciding whether they deserve an Oscar.",
      "C. Tell everyone accidents happen and carry on.",
      "D. Ask another child to score the performance out of ten."
    ]
  },
  {
    id: "q3",
    text: "A six-year-old confidently tells you: \"My uncle invented Wi-Fi.\"",
    options: [
      "A. Congratulate the uncle.",
      "B. Ask what inspired such a remarkable invention.",
      "C. Smile, enjoy the imagination and gently move the conversation on.",
      "D. Ask whether he also invented electricity."
    ]
  },
  {
    id: "q4",
    text: "You discover glitter... on the tables, the floor, your shoes, your face, and somehow your lunch.",
    options: [
      "A. Accept that glitter is forever.",
      "B. Blame the nearest child.",
      "C. Laugh, help tidy up and remember this is part of working with children.",
      "D. Resign immediately."
    ]
  },
  {
    id: "q5",
    text: "A child proudly gives you a drawing. It looks absolutely nothing like what they say it is.",
    options: [
      "A. \"That's... definitely something.\"",
      "B. \"Wow! Tell me about your picture.\"",
      "C. Guess it's a giraffe.",
      "D. Frame it and auction it at Sotheby's."
    ]
  },
  {
    id: "q6",
    text: "During story time a child interrupts for the fifteenth time.",
    options: [
      "A. Pause and involve them appropriately.",
      "B. Continue and hope they eventually run out of words.",
      "C. Politely remind them everyone deserves a turn.",
      "D. Offer them the job of Assistant Story Inspector."
    ]
  },
  {
    id: "q7",
    text: "You notice another Guide struggling with thirty excited children.",
    options: [
      "A. Wave sympathetically.",
      "B. Pretend you're invisible.",
      "C. Offer help if you can.",
      "D. Slowly walk backwards into a cupboard."
    ]
  },
  {
    id: "q8",
    text: "There aren't enough paintbrushes.",
    options: [
      "A. Borrow some from another group.",
      "B. Ask children to work in pairs.",
      "C. Inform your supervisor before supplies run out.",
      "D. Suggest finger painting (after checking it's appropriate)."
    ]
  },
  {
    id: "q9",
    text: "A child asks, \"How many stars are there?\"",
    options: [
      "A. 27.",
      "B. About the same number as grains of sand.",
      "C. \"That's a brilliant question. Let's find out together.\"",
      "D. \"Enough to keep astronauts busy.\""
    ]
  },
  {
    id: "q10",
    text: "Which sentence sounds MOST like a LOFT Guide?",
    options: [
      "A. \"Please don't ask questions.\"",
      "B. \"Let's see what happens.\"",
      "C. \"What do you think?\"",
      "D. \"Because I said so.\""
    ]
  },
  {
    id: "q11",
    text: "Two children are arguing about whose turn it is.",
    options: [
      "A. Flip a coin.",
      "B. Help them solve it fairly together.",
      "C. Declare yourself the winner.",
      "D. Introduce a VAR review."
    ]
  },
  {
    id: "q12",
    text: "A child tells you, \"My dad says I'm the fastest runner in Africa.\"",
    options: [
      "A. Sign them for the Olympics.",
      "B. Challenge them to a race.",
      "C. Smile and encourage their confidence without arguing.",
      "D. Ask whether they've raced a cheetah."
    ]
  },
  {
    id: "q13",
    text: "Your phone buzzes during an activity.",
    options: [
      "A. Reply quickly.",
      "B. Ignore it unless it's an emergency.",
      "C. Let the children answer it.",
      "D. Ask Siri what to do."
    ]
  },
  {
    id: "q14",
    text: "If working with children has taught the world one thing, it is...",
    options: [
      "A. Silence is overrated.",
      "B. Glitter obeys no laws of physics.",
      "C. Every child deserves to be seen, heard and encouraged.",
      "D. Socks disappear for mysterious reasons."
    ]
  },
  {
    id: "q15",
    text: "Which superpower would make the BEST LOFT Guide?",
    options: [
      "A. Flying.",
      "B. Reading minds.",
      "C. Unlimited patience.",
      "D. Turning vegetables into pizza."
    ]
  }
];

export const JUNGLE_ANIMAL_QUESTION = {
  text: "Which animal would you most like as your helper on a jungle adventure?",
  options: [
    "🐘 Elephant",
    "🦜 Parrot",
    "🐬 Dolphin",
    "🦉 Owl",
    "🐒 Monkey"
  ]
};
