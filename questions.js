// 10 text-style questions (fact ones removed)
window.TEXT_QUESTIONS = [
  // EASY (unchanged)
  {type:"text", q:"Which sentence is AI-generated?",
    options:[
      "I can’t start my day without coffee, or at least the idea of it.",
      "Morning routines are optimized through the ingestion of caffeinated liquid substances."
    ], answer:1, diff:"Easy"},

  {type:"text", q:"Which joke was AI-written?",
    options:[
      "I told my plants a joke today. They didn’t laugh, but they did look a little greener.",
      "Why did the algorithm cross the road? To optimize the chicken’s trajectory."
    ], answer:1, diff:"Easy"},

  {type:"text", q:"Which short diary note is AI?",
    options:[
      "Got caught in the rain today. Soaked, but the puddles made the city sparkle.",
      "Rainfall created hydration-based reflections on urban infrastructure."
    ], answer:1, diff:"Easy"},

  // MEDIUM (harder wording, still diff:"Medium")
  {type:"text", q:"Which reflection is AI?",
    options:[
      "Happiness is like sunlight through leaves — it arrives when you least try to hold it.",
      "Happiness manifests as a derivative affective state contingent upon attenuated stress variables and positive expectancy alignment."
    ], answer:1, diff:"Medium"},

  {type:"odd", q:"Two are real headlines. One is AI-generated. Which one?",
    options:[
      "Town installs solar-powered benches that charge phones",
      "City council approves blockchain-based empathy framework for civic disputes",
      "Local bakery revives century-old bread recipe for modern market"
    ],
    answer:1, diff:"Medium"},

  // HARD
  {type:"text", q:"Which answer is AI? — What does freedom mean?",
    options:[
      "Freedom is standing at the edge of possibility and knowing you can choose your step.",
      "Freedom constitutes a multi-layered construct enabling unconstrained agency within sociocultural and regulatory contexts."
    ], answer:1, diff:"Hard"},

  {type:"poem", q:"Odd one out: which poem is AI-generated?",
    options:[
      "Fog curls like an old cat around the harbor lights, patient and quiet.",
      "Semantic dawn propagates parameters across the lattice of experiential states.",
      "The orchard bends beneath its fruit, whispering of tomorrow’s sweetness."
    ],
    answer:1, diff:"Hard"
  },

  {type:"text", q:"Which short review was AI?",
    options:[
      "The coffee tasted smoky, almost like the fireplace at my grandmother’s cabin.",
      "The beverage exhibited acceptable aromatic density with moderate bitterness alignment across sips.",
      "Decent flavor, but the aftertaste lingered longer than I liked."
    ], answer:1, diff:"Hard"},

  {type:"text", q:"Which reflection is AI?",
    options:[
      "Failure carves the path, but the shape of the journey is still yours to walk.",
      "Failure constitutes a necessary variance parameter optimizing long-term adaptive success through contrastive evaluation."
    ], answer:1, diff:"Hard"},

  // FINAL
  {type:"text", q:"Which of these is the AI response? — What does love feel like?",
    options:[
      "Love is the hush in a storm when someone’s hand steadies yours.",
      "Love represents a dynamic neuroaffective construct integrating attachment schemas with dopaminergic salience and reward reinforcement."
    ], answer:1, diff:"Final"}
];
