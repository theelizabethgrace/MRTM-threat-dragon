﻿'use strict';

var jsonRulesEngine = require('json-rules-engine');

function threatengine() {

  var modelType = 'STRIDE';

  var service = {
    generatePerElement: generatePerElement,
    generateByContext: generateByContext
  };

  return service;

  function generatePerElement(element, type) {
    /* implements one of {STRIDE per element, LINDDUN per element, CIA} */
    var engine = new jsonRulesEngine.Engine();
    modelType = getModel(type);
    initialiseRulesPerElement(engine);
    addFacts(element, type, engine);
    return engine.run().then(onCompleted);

    function onCompleted(results) {
        /* output is like {type: ..., params: { param1: ..., param2: ...}} */
        return results.events.map(function(result) {
          /* to preserve backward compatibility use params for the threats */
          return result.params;
        });
      }

    function addFacts(element, type, engine) {
        engine.addFact('elementType', element.attributes.type);
        engine.addFact('diagramType', getModel(type));
      }
  }

  function generateByContext(element, type) {
    /* implements threats according to the element properties */
    var engine = new jsonRulesEngine.Engine();
    modelType = getModel(type);
    initialiseRulesByContext(engine);
    addFacts(element, type, engine);
    return engine.run().then(fixupByContext);

    function fixupByContext(results) {
      return results.events.map(function(result) {
        /* fix up for STRIDE / CIA / LINDDUN */
        result.params.modelType = modelType;
        switch (result.params.type) {
          case 'Linkability':
            if (modelType == 'STRIDE') {
              result.params.type = 'Information disclosure';
            } else if (modelType == 'CIA') {
              result.params.type = 'Confidentiality';
            }
            break;
          case 'Identifiability':
            if (modelType == 'STRIDE') {
              result.params.type = 'Spoofing';
            } else if (modelType == 'CIA') {
              result.params.type = 'Confidentiality';
            }
            break;
          case 'Repudiation':
            if (modelType == 'LINDDUN') {
                result.params.type = 'Non-repudiation';
            } else if (modelType == 'CIA') {
              result.params.type = 'Integrity';
            }
            break;
          case 'Detectability':
            if (modelType == 'STRIDE') {
              result.params.type = 'Information disclosure';
            } else if (modelType == 'CIA') {
              result.params.type = 'Confidentiality';
            }
            break;
          case 'Disclosure':
            if (modelType == 'LINDDUN') {
                result.params.type = 'Disclosure of information';
            } else if (modelType == 'STRIDE') {
                result.params.type = 'Information disclosure';
            } else if (modelType == 'CIA') {
              result.params.type = 'Confidentiality';
            }
            break;
          case 'Unawareness':
            if (modelType == 'STRIDE') {
              result.params.type = 'Elevation of privilege';
            } else if (modelType == 'CIA') {
              result.params.type = 'Integrity';
            }
            break;
          case 'Tampering':
            if (modelType == 'LINDDUN') {
              result.params.type = 'Non-compliance';
            } else if (modelType == 'CIA') {
              result.params.type = 'Integrity';
            }
            break;
        }
        return result.params;
      });
    }

    function addFacts(element, type, engine) {
      engine.addFact('elementType', element.attributes.type);
      engine.addFact('diagramType', getModel(type));
      engine.addFact('isPublicNetwork', element.isPublicNetwork);
      engine.addFact('isEncrypted', element.isEncrypted);
      engine.addFact('providesAuthentication', element.providesAuthentication);
      engine.addFact('isALog', element.isALog);
      engine.addFact('storesCredentials', element.storesCredentials);
      engine.addFact('storesInventory', element.storesInventory);
      engine.addFact('isEncrypted', element.isEncrypted);
      engine.addFact('isSigned', element.isSigned);
      engine.addFact('handlesCardPayment', element.handlesCardPayment);
      engine.addFact('isWebApplication', element.isWebApplication);
      engine.addFact('handlesGoodsOrServices', element.handlesGoodsOrServices);
      engine.addFact('privilegeLevel', element.privilegeLevel);
    }
  }

  function getModel(type) {
    /* diagram.diagramType in 'MRTM', 'STRIDE', 'LINDDUN', 'CIA'm*/
    if (type == 'MRTM' || type == 'STRIDE' || type ==  'LINDDUN' || type == 'CIA') {
      return type;
    } else {
      /* default is STRIDE if it is unrecognised */
      return 'MRTM';
    }
  }

  function initialiseRulesPerElement(engine) {

    /* STRIDE per element
              S | T | R | I | D | E
    ACTOR   | X |   | X |   |   |
    STORE   |   | X | X | X | X |
    PROCESS | X | X | X | X | X | X
    FLOW    |   | X |   | X | X |
    */

    /* STRIDE Spoofing */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'diagramType',
            operator: 'equal',
            value: 'STRIDE'
          }, {
            fact: 'elementType',
            operator: 'notEqual',
            value: 'tm.Store'
          }, {
            fact: 'elementType',
            operator: 'notEqual',
            value: 'tm.Flow'
          }
        ]
      },
      event: {
        type: 'b2a6d40d-d3f8-4750-8e4d-c02cc84b13dc',
        params: {
          ruleId: 'b2a6d40d-d3f8-4750-8e4d-c02cc84b13dc',
          title: 'Generic spoofing threat',
          type: 'Spoofing',
          modelType: 'STRIDE',
          status: 'Open',
          severity: 'Medium',
          description: 'A generic spoofing threat',
          mitigation: 'Mitigation or prevention for the threat'
        }
      }
    });

    /* STRIDE Tampering */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'diagramType',
            operator: 'equal',
            value: 'STRIDE'
          }, {
            fact: 'elementType',
            operator: 'notEqual',
            value: 'tm.Actor'
          }
        ]
      },
      event: {
        type: '4adaa48a-0345-4533-a189-64c98c4420dd',
        params: {
          ruleId: '4adaa48a-0345-4533-a189-64c98c4420dd',
          title: 'Generic tampering threat',
          type: 'Tampering',
          modelType: 'STRIDE',
          status: 'Open',
          severity: 'Medium',
          description: 'A generic tampering threat',
          mitigation: 'Mitigation or prevention for the threat'
        }
      }
    });

    /* STRIDE Repudiation */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'diagramType',
            operator: 'equal',
            value: 'STRIDE'
          }, {
            fact: 'elementType',
            operator: 'notEqual',
            value: 'tm.Flow'
          }
        ]
      },
      event: {
        type: '87bc37e2-798e-4d68-bb96-feb1da26da48',
        params: {
          ruleId: '87bc37e2-798e-4d68-bb96-feb1da26da48',
          title: 'Generic repudiation threat',
          type: 'Repudiation',
          modelType: 'STRIDE',
          status: 'Open',
          severity: 'Medium',
          description: 'A generic repudiation threat',
          mitigation: 'Mitigation or prevention for the threat'
        }
      }
    });

    /* STRIDE Information disclosure */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'diagramType',
            operator: 'equal',
            value: 'STRIDE'
          }, {
            fact: 'elementType',
            operator: 'notEqual',
            value: 'tm.Actor'
          }
        ]
      },
      event: {
        type: '13000296-b17d-4b72-9cc4-f5cc33f80e4c',
        params: {
          ruleId: '13000296-b17d-4b72-9cc4-f5cc33f80e4c',
          title: 'Generic information disclosure threat',
          type: 'Information disclosure',
          modelType: 'STRIDE',
          status: 'Open',
          severity: 'Medium',
          description: 'A generic information disclosure threat',
          mitigation: 'Mitigation or prevention for the threat'
        }
      }
    });

    /* STRIDE DoS */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'diagramType',
            operator: 'equal',
            value: 'STRIDE'
          }, {
            fact: 'elementType',
            operator: 'notEqual',
            value: 'tm.Actor'
          }
        ]
      },
      event: {
        type: 'edb05d76-a695-455f-947b-7d67b78bc31d',
        params: {
          ruleId: 'edb05d76-a695-455f-947b-7d67b78bc31d',
          title: 'Generic DoS threat',
          type: 'Denial of service',
          modelType: 'STRIDE',
          status: 'Open',
          severity: 'Medium',
          description: 'A generic DoS threat',
          mitigation: 'Mitigation or prevention for the threat'
        }
      }
    });

    /* STRIDE Elevation of privileges */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'diagramType',
            operator: 'equal',
            value: 'STRIDE'
          },
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Process'
          }
        ]
      },
      event: {
        type: 'c1377855-ea20-4c97-8861-f95c364fb8d2',
        params: {
          ruleId: 'c1377855-ea20-4c97-8861-f95c364fb8d2',
          title: 'Generic elevation threat',
          type: 'Elevation of privilege',
          modelType: 'STRIDE',
          status: 'Open',
          severity: 'Medium',
          description: 'A generic elevation of privileges threat',
          mitigation: 'Mitigation or prevention for the threat'
        }
      }
    });

    /* CIA per element is all three for all elements except boundary */
    /* CIA Confidentiality */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'diagramType',
            operator: 'equal',
            value: 'CIA'
          }
        ]
      },
      event: {
        type: '0f20e64c-5d03-42ac-b0ae-ed105a38ee1f',
        params: {
          ruleId: '0f20e64c-5d03-42ac-b0ae-ed105a38ee1f',
          title: 'Generic threat to Confidentiality',
          type: 'Confidentiality',
          modelType: 'CIA',
          status: 'Open',
          severity: 'Medium',
          description: 'A generic threat to confidentiality',
          mitigation: 'Mitigation or prevention for the threat'
        }
      }
    });

    /* CIA Integrity */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'diagramType',
            operator: 'equal',
            value: 'CIA'
          }
        ]
      },
      event: {
        type: '42511938-37d9-4bb6-866c-947a7c776e7e',
        params: {
          ruleId: '42511938-37d9-4bb6-866c-947a7c776e7e',
          title: 'Generic threat to Integrity',
          type: 'Integrity',
          modelType: 'CIA',
          status: 'Open',
          severity: 'Medium',
          description: 'A generic threat to integrity',
          mitigation: 'Mitigation or prevention for the threat'
        }
      }
    });

    /* CIA Availability */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'diagramType',
            operator: 'equal',
            value: 'CIA'
          }
        ]
      },
      event: {
        type: '52453492-f49f-411e-a59d-5fc2dd98664b',
        params: {
          ruleId: '52453492-f49f-411e-a59d-5fc2dd98664b',
          title: 'Generic threat to Availability',
          type: 'Availability',
          modelType: 'CIA',
          status: 'Open',
          severity: 'Medium',
          description: 'A generic threat to availability',
          mitigation: 'Mitigation or prevention for the threat'
        }
      }
    });

    /* MRTM per element
              SE | SS| D | I |
    ACTOR   | X  | X |   |   |
    STORE   |    |   |   | X |
    FLOW    |  X | X |   |   |
    PROCESS |    |   | X |   |
    */
    /* MRTM Social Engineering */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'diagramType',
            operator: 'equal',
            value: 'MRTM'
          }, {
            fact: 'elementType',
            operator: 'notEqual',
            value: 'tm.Store'
          }, { 
            fact: 'elementType',
            operator: 'notEqual',
            value: 'tm.Process'
          }
        ]
      },
      event: {
        type: '896abdef-0e7e-46ec-aeaa-b8e70c233d57',
        params: {
          ruleId: '896abdef-0e7e-46ec-aeaa-b8e70c233d57',
          title: 'Generic threat to Reliability',
          type: 'Social engineering',
          modelType: 'MRTM',
          status: 'Open',
          severity: 'Medium',
          description: 'A generic reliability threat',
          mitigation: 'Mitigation or prevention for the threat'
        }
      }
    });

    /* MRTM shoulder surfing */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'diagramType',
            operator: 'equal',
            value: 'MRTM'
          }, {
            fact: 'elementType',
            operator: 'notEqual',
            value: 'tm.Store'
          }, {
            fact: 'elementType',
            operator: 'notEqual',
            value: 'tm.Process'
          }
        ]
      },
      event: {
        type: '9128c587-bc76-41d0-a02d-5de3b539ecc0',
        params: {
          ruleId: '9128c587-bc76-41d0-a02d-5de3b539ecc0',
          title: 'Generic threat to Integrity',
          type: 'Shoulder surfing',
          modelType: 'MRTM',
          status: 'Open',
          severity: 'Medium',
          description: 'A generic integrity threat',
          mitigation: 'Mitigation or prevention for the threat'
        }
      }
    });

    /* MRTM Detectability */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'diagramType',
            operator: 'equal',
            value: 'MRTM'
          }, {
            fact: 'elementType',
            operator: 'notEqual',
            value: 'tm.Actor'
          }, {
            fact: 'elementType',
            operator: 'notEqual',
            value: 'tm.Store'
          }, {
            fact: 'elementType',
            operator: 'notEqual',
            value: 'tm.Flow'
          }
        ]
      },
      event: {
        type: '74834f24-8f89-40bb-b0c6-d1fdd8b8accc',
        params: {
          ruleId: '74834f24-8f89-40bb-b0c6-d1fdd8b8accc',
          title: 'Generic threat to Undectability',
          type: 'Detectability',
          modelType: 'MRTM',
          status: 'Open',
          severity: 'Medium',
          description: 'A generic undetectability threat',
          mitigation: 'Mitigation or prevention for the threat'
        }
      }
    });

        /* MRTM Identity Theft */
        engine.addRule({
          conditions: {
            all: [
              {
                fact: 'diagramType',
                operator: 'equal',
                value: 'MRTM'
              }, {
                fact: 'elementType',
                operator: 'notEqual',
                value: 'tm.Actor'
              }, {
                fact: 'elementType',
                operator: 'notEqual',
                value: 'tm.Flow'
              }, {
                fact: 'elementType',
                operator: 'notEqual',
                value: 'tm.Process'
              }
            ]
          },
          event: {
            type: 'df43b091-9ffb-44e3-9eb9-471b9ee56d39',
            params: {
              ruleId: 'df43b091-9ffb-44e3-9eb9-471b9ee56d39',
              title: 'Generic threat to Authorization',
              type: 'Identity Theft',
              modelType: 'MRTM',
              status: 'Open',
              severity: 'Medium',
              description: 'A generic authorization threat',
              mitigation: 'Mitigation or prevention for the threat'
            }
          }
        });  

  }

  function initialiseRulesByContext(engine) {
    /* If no context threat suggestion respond with empty threat */
    engine.addRule({
      conditions: {
        any: [
          {
            all: [
              {
                fact: 'elementType',
                operator: 'equal',
                value: 'tm.Actor'
              } , {
                any: [
                  {
                    fact: 'providesAuthentication',
                    operator: 'equal',
                    value: false
                  }, {
                    fact: 'providesAuthentication',
                    operator: 'equal',
                    value: undefined
                  }
                ]
              }
            ]
          }, {
            all: [
              {
                fact: 'elementType',
                operator: 'equal',
                value: 'tm.Flow'
              } , {
                any: [
                  {
                    fact: 'isPublicNetwork',
                    operator: 'equal',
                    value: false
                  }, {
                    fact: 'isPublicNetwork',
                    operator: 'equal',
                    value: undefined
                  }
                ]
              } , {
                any: [
                  {
                    fact: 'isEncrypted',
                    operator: 'equal',
                    value: false
                  }, {
                    fact: 'isEncrypted',
                    operator: 'equal',
                    value: undefined
                  }
                ]
              }
            ]
          }
        ]
      },
      event: {
        type: 'eeb8d742-5213-44b2-bfc3-c454e4e03fbf',
        params: {
          ruleId: 'eeb8d742-5213-44b2-bfc3-c454e4e03fbf',
          title: 'No context threat suggestion',
          type: 'TBD',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'No context specific threat identified, if appropriate add one manually',
          mitigation: 'Describe mitigation or prevention for this threat'
        }
      }
    });

    /* OATs CAPTCHA defeat */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Actor'
          } , {
            fact: 'providesAuthentication',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: '5b0d4c4e-8245-4bea-a2ad-cf0be0a441f5',
        params: {
          ruleId: '5b0d4c4e-8245-4bea-a2ad-cf0be0a441f5',
          title: 'CAPTCHA defeat',
          type: 'Unawareness',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #9:\nAutomation is used in an attempt to analyse and determination the answers to CAPTCHA tests and related puzzles',
          mitigation: 'Defences include guarding against automation, unguessable CAPTCHA and proper enforcement of behavioral workflow'
        }
      }
    });

    /* OATs Credential stuffing */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Actor'
          } , {
            fact: 'providesAuthentication',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: 'da483c51-1891-46ac-8453-6b1706b2a3d6',
        params: {
          ruleId: 'da483c51-1891-46ac-8453-6b1706b2a3d6',
          title: 'Credential stuffing',
          type: 'Disclosure',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #8:\nLists of stolen authentication credentials are tested against the application’s authentication mechanisms to identify whether users have re-used the same login credentials',
          mitigation: 'Defences against Credential Stuffing are described in the OWASP Credential Stuffing Prevention Cheat Sheet, Multi-Factor Authentication being a primary counter-measure'
        }
      }
    });

    /* Use encryption over public networks */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Flow'
          } , {
            fact: 'isPublicNetwork',
            operator: 'equal',
            value: true
          } , {
            any: [
              {
                fact: 'isEncrypted',
                operator: 'equal',
                value: false
              }, {
                fact: 'isEncrypted',
                operator: 'equal',
                value: undefined
              }
            ]
          }
        ]
      },
      event: {
        type: '021ab22d-8d51-4501-9bb8-6dabf9c27f0d',
        params: {
          ruleId: '021ab22d-8d51-4501-9bb8-6dabf9c27f0d',
          title: 'Use encryption',
          type: 'Disclosure',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'Unencrypted data sent over a public network may be intercepted and read by an attacker',
          mitigation: 'Data should be encrypted either at the message or transport level'
        }
      }
    });

    /* Vulnerable transport protocol */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Flow'
          } , {
            fact: 'isEncrypted',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: 'ff2fca4d-dedf-46f2-b9ac-aed70055bb4d',
        params: {
          ruleId: 'ff2fca4d-dedf-46f2-b9ac-aed70055bb4d',
          title: 'Vulnerable transport protocol',
          type: 'Disclosure',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'Older transport protocols are vulnerable and have known vulnerabilities',
          mitigation: 'Use up to date cryptography and transport protocols'
        }
      }
    });

    /* OATs Fingerprinting */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Flow'
          } , {
            fact: 'isPublicNetwork',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: 'f5f817d5-a067-4415-a40a-b500cb2ab9ad',
        params: {
          ruleId: 'f5f817d5-a067-4415-a40a-b500cb2ab9ad',
          title: 'Fingerprinting',
          type: 'Linkability',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #4:\nSpecific requests are sent to the application eliciting information in order to profile the application',
          mitigation: 'Defence includes restricting what information is provided, for example version numbers and package details'
        }
      }
    });

    /* Least privilege */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Process'
          }, {
            fact: 'privilegeLevel',
            operator: 'notEqual',
            value: ''
          }, {
            fact: 'privilegeLevel',
            operator: 'notEqual',
            value: undefined
          }
        ]
      },
      event: {
        type: '6463e063-e7c5-4305-9d8d-0c8e978ab86b',
        params: {
          ruleId: '6463e063-e7c5-4305-9d8d-0c8e978ab86b',
          title: 'Least privilege',
          type: 'Unawareness',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'If a process is comprimised and under control of a malicious actor, horizontal/lateral elevation of privilege can be used to comprimise other processes',
          mitigation: 'Processes should run with least privilege that is practical, to minimise the impact of horizontal elevation of privilege'
        }
      }
    });

    /* OATs Expediting */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Process'
          }
        ]
      },
      event: {
        type: 'ea1adb4d-097d-45a8-8e48-b728a996f487',
        params: {
          ruleId: 'ea1adb4d-097d-45a8-8e48-b728a996f487',
          title: 'Expediting',
          type: 'Tampering',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #6:\nUsing speed to violate explicit or implicit assumptions about the application’s normal use to achieve unfair individual gain',
          mitigation: 'Defences include providing enforcement of behavioral workflow and anti-automation'
        }
      }
    });

    /* OATs Vulnerability scanning */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Process'
          }
        ]
      },
      event: {
        type: 'd97bcb80-f96d-44af-869a-d0441761be05',
        params: {
          ruleId: 'd97bcb80-f96d-44af-869a-d0441761be05',
          title: 'Vulnerability scanning',
          type: 'Disclosure',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #14:\nSystematic enumeration and examination in order to find weaknesses and points where a security vulnerability might exist',
          mitigation: 'Defence includes providing anti-automation'
        }
      }
    });

    /* OATs Denial of Service */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Process'
          }
        ]
      },
      event: {
        type: 'ce2fe37e-0742-4278-8915-40dc2226150e',
        params: {
          ruleId: 'ce2fe37e-0742-4278-8915-40dc2226150e',
          title: 'Denial of Service',
          type: 'Unawareness',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #15:\nUsage may resemble legitimate application usage but leads to exhaustion of resources',
          mitigation: 'Mitigation or prevention such as providing backoff, resource management and avoiding forced deadlock'
        }
      }
    });

    /* OATs Carding */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Process'
          } , {
            fact: 'handlesCardPayment',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: '6cc27f83-ae03-4589-8e9b-24d4c2d4d8cd',
        params: {
          ruleId: '6cc27f83-ae03-4589-8e9b-24d4c2d4d8cd',
          title: 'Carding',
          type: 'Disclosure',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #1:\nLists of full credit/debit card data are tested against a merchant`s payment processes to identify valid card details',
          mitigation: 'Defences include control of interaction frequency, enforcement of a single unique a action and preventing abuse of functionality'
        }
      }
    });

    /* OATs Card cracking */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Process'
          } , {
            fact: 'handlesCardPayment',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: '505afd31-7b3f-4733-b91c-71abb488d2eb',
        params: {
          ruleId: '505afd31-7b3f-4733-b91c-71abb488d2eb',
          title: 'Card cracking',
          type: 'Disclosure',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #10:\nBrute force attack against application payment card process to identify the missing values for start date, expiry date and card security code',
          mitigation: 'Defences include control of interaction frequency, preventing brute force attacks and anti-automation'
        }
      }
    });

    /* OATs Cashing out */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Process'
          } , {
            fact: 'handlesCardPayment',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: 'c7b098d3-34df-432a-ad52-8f10c4ef6b07',
        params: {
          ruleId: 'c7b098d3-34df-432a-ad52-8f10c4ef6b07',
          title: 'Cashing out',
          type: 'Repudiation',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #12:\nObtaining currency or higher-value merchandise via the application using stolen previously validated payment cards or account login credentials',
          mitigation: 'Defences include control of interaction frequency, enforcement of a single unique action, anti-automation and preventing abuse of functionality'
        }
      }
    });

    /* OATs Footprinting */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Process'
          } , {
            fact: 'isWebApplication',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: '20527bee-aae7-4593-acac-7a07169ccc4f',
        params: {
          ruleId: '20527bee-aae7-4593-acac-7a07169ccc4f',
          title: 'Footprinting',
          type: 'Disclosure',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #18:\nInformation gathering with the objective of learning as much as possible about the composition, configuration and security mechanisms of the application',
          mitigation: 'Defences include shutting down unnecessary services/ports and excluding information that could identify and compromise security of the organisation'
        }
      }
    });

    /* OATs Scalping */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Process'
          } , {
            fact: 'handlesGoodsOrServices',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: '97915248-fc96-4fe1-9122-7bbd00fe71de',
        params: {
          ruleId: '97915248-fc96-4fe1-9122-7bbd00fe71de',
          title: 'Scalping',
          type: 'Unawareness',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #5:\nMass acquisition of goods or services using the application in a manner that a normal user would be unable to undertake manually',
          mitigation: 'Defences against this automated threat include control of interaction frequency, enforcement of a single unique a action and enforcement of behavioral workflow'
        }
      }
    });

    /* OATs Sniping */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Process'
          } , {
            fact: 'handlesGoodsOrServices',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: 'd6d15882-15d5-4da1-88a5-dc3eae0b4a64',
        params: {
          ruleId: 'd6d15882-15d5-4da1-88a5-dc3eae0b4a64',
          title: 'Sniping',
          type: 'Unawareness',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #13:\nAutomated exploitation of system latencies in the form of timing attacks',
          mitigation: 'Defences include anti-automation and prevention of abuse of functionality'
        }
      }
    });

    /* OATs Denial of inventory */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Process'
          } , {
            fact: 'handlesGoodsOrServices',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: '7403fdb4-9d89-4fb7-be5c-c37ce142af5e',
        params: {
          ruleId: '7403fdb4-9d89-4fb7-be5c-c37ce142af5e',
          title: 'Denial of inventory ',
          type: 'Unawareness',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #21:\nSelection and deliberate holding of items from a limited inventory or stock such that other users are unable to buy/pay/confirm the items',
          mitigation: 'Defences include control of interaction frequency and anti-automation'
        }
      }
    });

    /* OATs Scraping */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Store'
          }
        ]
      },
      event: {
        type: '80f32309-4f8a-4676-993b-7a37cbf62df1',
        params: {
          ruleId: '80f32309-4f8a-4676-993b-7a37cbf62df1',
          title: 'Scraping',
          type: 'Linkability',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #11:\nCollecting accessible data and/or processed output from the application',
          mitigation: 'Detect fake or compromised accounts, ensure information is accessible only with authentication and authorisation'
        }
      }
    });

    /* OATs Skewing */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Store'
          }
        ]
      },
      event: {
        type: '40aee5ad-37ff-4c70-91d4-9ab6d91d1463',
        params: {
          ruleId: '40aee5ad-37ff-4c70-91d4-9ab6d91d1463',
          title: 'Skewing',
          type: 'Unawareness',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #16:\nAutomated repeated clicking or requesting or submitting content, affecting application based metrics such as counts, and measures of frequency and/or rate',
          mitigation: 'Defences include control of interaction frequency or proper enforcement of a single unique action'
        }
      }
    });

    /* OATs Spamming */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Store'
          }
        ]
      },
      event: {
        type: 'fe90a897-3ff2-47a5-94db-2a4d6f17bb57',
        params: {
          ruleId: 'fe90a897-3ff2-47a5-94db-2a4d6f17bb57',
          title: 'Spamming',
          type: 'Unawareness',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #17:\nStoring malicious such as malware, Iframe distribution, photographs & videos, advertisements, referrer spam and tracking/surveillance code',
          mitigation: 'Defences include detecting embedded malicious code, controling interaction frequency and enforcement of a single unique action'
        }
      }
    });

    /* OATs Credential cracking */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Store'
          } , {
            fact: 'storesCredentials',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: 'dc09cecf-cb06-455d-9e77-b9372bf6c8eb',
        params: {
          ruleId: 'dc09cecf-cb06-455d-9e77-b9372bf6c8eb',
          title: 'Credential cracking',
          type: 'Disclosure',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #7:\nBrute force, dictionary and guessing attacks used against authentication processes of the application to identify valid account credentials',
          mitigation: 'Defences include restriction of excessive authentication attempts, control of interaction frequency and enforcement of a single unique action'
        }
      }
    });

    /* OATs Account creation */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Store'
          } , {
            fact: 'storesCredentials',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: 'd960d589-80da-41dc-a7c2-33136bdda7e0',
        params: {
          ruleId: 'd960d589-80da-41dc-a7c2-33136bdda7e0',
          title: 'Account creation',
          type: 'Unawareness',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #19:\nBulk account creation, and sometimes profile population, by using the application’s account signup processes',
          mitigation: 'Defences include control of interaction frequency, enforcement of a single unique a action and enforcement of behavioral workflow'
        }
      }
    });

    /* OATs Account aggregation */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Store'
          } , {
            fact: 'storesCredentials',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: '7b1c36b3-104a-4d82-97bb-a64c12284641',
        params: {
          ruleId: '7b1c36b3-104a-4d82-97bb-a64c12284641',
          title: 'Account aggregation',
          type: 'Identifiability',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #20:\nCompilation of credentials and information from multiple application accounts into another system',
          mitigation: 'Defences include control of interaction frequency and prevention of abuse of functionality'
        }
      }
    });

    /* OATs Coupon cracking */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Store'
          } , {
            fact: 'storesInventory',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: '3853aaed-f262-4310-98df-484c5ef6609a',
        params: {
          ruleId: '3853aaed-f262-4310-98df-484c5ef6609a',
          title: 'Coupon cracking',
          type: 'Tampering',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #2:\nMass enumeration (for example coupon numbers, voucher codes, discount tokens) providing some form of user benefit within the application',
          mitigation: 'Defences include providing anti-automation, guarding against brute force, and preventing abuse of functionality'
        }
      }
    });

    /* OATs Scalping */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Store'
          } , {
            fact: 'storesInventory',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: 'c50e8d53-5e0a-45e7-8c69-be92492ad7dc',
        params: {
          ruleId: 'c50e8d53-5e0a-45e7-8c69-be92492ad7dc',
          title: 'Scalping',
          type: 'Unawareness',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'See OWASP Automated Threat #5:\nMass acquisition of goods or services using the application in a manner that a normal user would be unable to undertake manually',
          mitigation: 'Defences against this automated threat include control of interaction frequency, enforcement of a single unique a action and enforcement of behavioral workflow'
        }
      }
    });

    /* Vulnerable encryption algorithms */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Store'
          } , {
            fact: 'isEncrypted',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: '4fb623f6-2896-4209-8689-ff1b8a932105',
        params: {
          ruleId: '4fb623f6-2896-4209-8689-ff1b8a932105',
          title: 'Vulnerable encryption algorithms',
          type: 'Disclosure',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'Out of date encryption algorithms are vulnerable and have known vulnerabilities',
          mitigation: 'Use up to date cryptography for all signatures and encryption'
        }
      }
    });

    /* Vulnerable cryptography */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Store'
          } , {
            fact: 'isSigned',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: '034095d9-9012-4cb5-a7a8-1e19ab72bba3',
        params: {
          ruleId: '034095d9-9012-4cb5-a7a8-1e19ab72bba3',
          title: 'Vulnerable cryptography',
          type: 'Disclosure',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'Out of date cryptographic techniques are vulnerable and have known vulnerabilities',
          mitigation: 'Use up to date cryptographic methods for checksums, signatures and certificates'
        }
      }
    });

    /* Logs contain sensitive data */
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'elementType',
            operator: 'equal',
            value: 'tm.Store'
          } , {
            fact: 'isALog',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: '7942656e-51dd-4b15-a38d-deab704878e1',
        params: {
          ruleId: '7942656e-51dd-4b15-a38d-deab704878e1',
          title: 'Logs contain sensitive data ',
          type: 'Disclosure',
          modelType: 'TBD',
          status: 'Open',
          severity: 'Medium',
          description: 'Logs are read by unauthorised users or made public, sensitive data is then disclosed',
          mitigation: 'Minimise any sensitive data contained in logs, consider encryption techniques'
        }
      }
    });

  }
}

module.exports = threatengine;
