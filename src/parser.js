import { scanToken } from './tokenizer';

/**
 * Parser
 */
export function parse (input, isStrict = true) {
  const topLevelState = initState({ input });
  const topLevelStatement = {
    type: 'QUERY',
    start: 0,
    end: input.length - 1,
    body: [],
    tokens: [],
  };

  let prevState = topLevelState;
  let statementParser;

  const ignoreOutsideBlankTokens = [
    'whitespace',
    'comment-inline',
    'comment-block',
  ];

  while (prevState.position < topLevelState.end) {
    const tokenState = initState({ prevState });
    const token = scanToken(tokenState);

    if (!statementParser) {
      // ignore blank tokens that are not in a statement
      if (~ignoreOutsideBlankTokens.indexOf(token.type)) {
        topLevelStatement.tokens.push(token);
        prevState = tokenState;
        continue;
      }

      statementParser = createStatementParserByToken(isStrict, token);
    }

    statementParser.addToken(token);
    topLevelStatement.tokens.push(token);
    prevState = tokenState;

    const statement = statementParser.getStatement();
    if (statement.endStatement) {
      statement.end = token.end;
      topLevelStatement.body.push(statement);
      statementParser = null;
    }
  }

  // last statement without ending key
  if (statementParser) {
    const statement = statementParser.getStatement();
    if (!statement.endStatement) {
      statement.end = topLevelStatement.end;
      topLevelStatement.body.push(statement);
    }
  }

  return topLevelStatement;
}


function initState ({ input, prevState }) {
  if (prevState) {
    return {
      input: prevState.input,
      position: prevState.position,
      start: prevState.position + 1,
      end: prevState.input.length - 1,
      body: [],
    };
  }

  return {
    input,
    position: -1,
    start: 0,
    end: input.length - 1,
    body: [],
  };
}


function createStatementParserByToken (isStrict, token) {
  if (token.type === 'keyword') {
    switch (token.value.toUpperCase()) {
      case 'SELECT': return createSelectStatementParser(isStrict);
      case 'CREATE': return createCreateStatementParser(isStrict);
      case 'DROP': return createDropStatementParser(isStrict);
      case 'INSERT': return createInsertStatementParser(isStrict);
      case 'UPDATE': return createUpdateStatementParser(isStrict);
      case 'DELETE': return createDeleteStatementParser(isStrict);
      case 'TRUNCATE': return createTruncateStatementParser(isStrict);
      default: break;
    }
  }

  if (!isStrict && token.type === 'unknown') {
    return createUnknownStatementParser(isStrict);
  }

  throw new Error(`Invalid statement parser "${token.value}"`);
}


function createSelectStatementParser (isStrict) {
  const statement = {};

  const steps = [
    // Select
    {
      preCanGoToNext: () => false,
      validation: {
        acceptTokens: [
          { type: 'keyword', value: 'SELECT' },
        ],
      },
      add: (token) => {
        statement.type = 'SELECT';
        statement.start = token.start;
      },
      postCanGoToNext: () => true,
    },
  ];

  return stateMachineStatementParser(isStrict, statement, steps);
}


function createInsertStatementParser (isStrict) {
  const statement = {};

  const steps = [
    // Insert
    {
      preCanGoToNext: () => false,
      validation: {
        acceptTokens: [
          { type: 'keyword', value: 'INSERT' },
        ],
      },
      add: (token) => {
        statement.type = 'INSERT';
        statement.start = token.start;
      },
      postCanGoToNext: () => true,
    },
  ];

  return stateMachineStatementParser(isStrict, statement, steps);
}


function createUpdateStatementParser (isStrict) {
  const statement = {};

  const steps = [
    // Update
    {
      preCanGoToNext: () => false,
      validation: {
        acceptTokens: [
          { type: 'keyword', value: 'UPDATE' },
        ],
      },
      add: (token) => {
        statement.type = 'UPDATE';
        statement.start = token.start;
      },
      postCanGoToNext: () => true,
    },
  ];

  return stateMachineStatementParser(isStrict, statement, steps);
}


function createDeleteStatementParser (isStrict) {
  const statement = {};

  const steps = [
    // Delete
    {
      preCanGoToNext: () => false,
      validation: {
        acceptTokens: [
          { type: 'keyword', value: 'DELETE' },
        ],
      },
      add: (token) => {
        statement.type = 'DELETE';
        statement.start = token.start;
      },
      postCanGoToNext: () => true,
    },
  ];

  return stateMachineStatementParser(isStrict, statement, steps);
}


function createCreateStatementParser (isStrict) {
  const statement = {};

  const steps = [
    // Create
    {
      preCanGoToNext: () => false,
      validation: {
        acceptTokens: [
          { type: 'keyword', value: 'CREATE' },
        ],
      },
      add: (token) => {
        statement.start = token.start;
      },
      postCanGoToNext: () => true,
    },
    // Table/Database
    {
      preCanGoToNext: () => false,
      validation: {
        requireBefore: ['whitespace'],
        acceptTokens: [
          { type: 'keyword', value: 'TABLE' },
          { type: 'keyword', value: 'DATABASE' },
        ],
      },
      add: (token) => {
        statement.type = `CREATE_${token.value.toUpperCase()}`;
      },
      postCanGoToNext: () => true,
    },
  ];

  return stateMachineStatementParser(isStrict, statement, steps);
}


function createDropStatementParser (isStrict) {
  const statement = {};

  const steps = [
    // Drop
    {
      preCanGoToNext: () => false,
      validation: {
        acceptTokens: [
          { type: 'keyword', value: 'DROP' },
        ],
      },
      add: (token) => {
        statement.start = token.start;
      },
      postCanGoToNext: () => true,
    },
    // Table/Database
    {
      preCanGoToNext: () => false,
      validation: {
        requireBefore: ['whitespace'],
        acceptTokens: [
          { type: 'keyword', value: 'TABLE' },
          { type: 'keyword', value: 'DATABASE' },
        ],
      },
      add: (token) => {
        statement.type = `DROP_${token.value.toUpperCase()}`;
      },
      postCanGoToNext: () => true,
    },
  ];

  return stateMachineStatementParser(isStrict, statement, steps);
}


function createTruncateStatementParser (isStrict) {
  const statement = {};

  const steps = [
    {
      preCanGoToNext: () => false,
      validation: {
        acceptTokens: [
          { type: 'keyword', value: 'TRUNCATE' },
        ],
      },
      add: (token) => {
        statement.type = 'TRUNCATE';
        statement.start = token.start;
      },
      postCanGoToNext: () => true,
    },
  ];

  return stateMachineStatementParser(isStrict, statement, steps);
}


function createUnknownStatementParser (isStrict) {
  const statement = {};

  const steps = [
    {
      preCanGoToNext: () => false,
      add: (token) => {
        statement.type = 'UNKNOWN';
        statement.start = token.start;
      },
      postCanGoToNext: () => true,
    },
  ];

  return stateMachineStatementParser(isStrict, statement, steps);
}


function stateMachineStatementParser (isStrict, statement, steps) {
  let currentStepIndex = 0;
  let prevToken;

  /* eslint arrow-body-style: 0, no-extra-parens: 0 */
  const isValidToken = (step, token) => {
    if (!step.validation) {
      return true;
    }

    return step
      .validation
      .acceptTokens.filter(accept => {
        const isValidType = token.type === accept.type;
        const isValidValue = (
          !accept.value
          || token.value.toUpperCase() === accept.value
        );

        return isValidType && isValidValue;
      }).length > 0;
  };

  const hasRequiredBefore = (step) => {
    return (
      !step.requireBefore
      || ~step.requireBefore.indexOf(prevToken.type)
    );
  };

  return {
    getStatement () {
      return statement;
    },

    addToken (token) {
      /* eslint no-param-reassign: 0 */
      if (statement.endStatement) {
        throw new Error('This statement has already got to the end.');
      }

      if (token.type === 'semicolon') {
        statement.endStatement = ';';
        return;
      }

      if (token.type === 'whitespace') {
        prevToken = token;
        return;
      }

      if (statement.type) {
        // statement has already been identified
        // just wait until end of the statement
        return;
      }

      let currentStep = steps[currentStepIndex];
      if (currentStep.preCanGoToNext(token)) {
        currentStepIndex++;
        currentStep = steps[currentStepIndex];
      }

      if (!hasRequiredBefore(currentStep)) {
        const requireds = currentStep.requireBefore.join(' or ');
        throw new Error(`Expected any of these tokens ${requireds} before "${token.value}" (currentStep=${currentStepIndex}).`);
      }

      if (!isValidToken(currentStep, token) && isStrict) {
        const expecteds = currentStep
          .validation
          .acceptTokens
          .map(accept => `(type="${accept.type}" value="${accept.value}")`)
          .join(' or ');
        throw new Error(`Expected any of these tokens ${expecteds} instead of type="${token.type}" value="${token.value}" (currentStep=${currentStepIndex}).`);
      }

      currentStep.add(token);

      if (currentStep.postCanGoToNext(token)) {
        currentStepIndex++;
      }

      prevToken = token;
    },
  };
}
