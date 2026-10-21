// Casos de referencia de ÁreaCalc (T-02; design.md §15).
//
// Transcribe los valores esperados de requirements.md §14, contrastados con
// docs/formulario-matematico.md (§2 y §4 a §13), más algunos datos que fijan
// design.md §8 y tasks.md. Nunca se calculan con el código del producto (R-25.1):
// este archivo no importa nada de src/. R los verifica en T-R1.
//
// Convenciones:
// - exacta(num, den, decimal): valor racional exacto, escrito como fracción
//   irreducible { num, den } de BigInt con den > 0n, igual que un Racional
//   (design §6). `decimal` es el texto que da la fuente: «=» si el decimal es
//   exacto, «≈» si está redondeado y «Q» en los importes.
// - aproximada(decimal, formaExacta): valor que solo se obtiene aproximado
//   (ceros irracionales, W-04). `formaExacta` es su expresión simbólica.
// - multiploPi(num, den, decimal): k·π exacto, con su decimal aproximado.
// - Solo se incluyen los datos que fijan las fuentes. Si la fuente no fija la
//   interpretación, el caso no la incluye: I, A_geo y f_prom no dependen de ella.
// - `pendientes` lista los datos que una prueba de principio a fin necesitaría y
//   que las fuentes no fijan. No se rellenan por suposición.
// - Están los casos MVP y COMP de requirements §14. Los POSTERIOR (CR-24 a CR-26)
//   quedan fuera porque no condicionan el MVP (R-25.5).

/** Valor racional exacto, transcrito ya irreducible. */
function exacta(num, den = 1n, decimal) {
  return { clase: 'exacta', valor: { num, den }, ...(decimal ? { decimal } : {}) };
}

/** Valor que solo se conoce aproximado; la fuente fija su texto, no una cota. */
function aproximada(decimal, formaExacta) {
  return { clase: 'aproximada', ...(decimal ? { decimal } : {}), formaExacta };
}

/** k·π exacto (círculo), con su aproximación decimal. */
function multiploPi(num, den, decimal) {
  return { clase: 'multiploPi', coeficiente: { num, den }, decimal };
}

/** Congela el árbol completo para que ninguna prueba modifique los casos. */
function congelar(objeto) {
  for (const valor of Object.values(objeto)) {
    if (typeof valor === 'object' && valor !== null) congelar(valor);
  }
  return Object.freeze(objeto);
}

export const CASOS = congelar({
  'CR-01': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §4.2 y §13',
    entrada: { textoFuncion: 'x^3 - 1', textoA: '1', textoB: '4', interpretacion: 'abstracta' },
    esperado: {
      antiderivada: 'x⁴/4 − x',
      Fb: exacta(60n),
      Fa: exacta(-3n, 4n),
      I: exacta(243n, 4n, '= 60.75'),
      Ageo: exacta(243n, 4n, '= 60.75'),
      fProm: exacta(81n, 4n, '= 20.25'),
      unidades: { area: 'u²', fProm: 'u' },
      ceros: [{ valor: exacta(1n), tipo: 'extremo' }],
      advertencias: ['W-03']
    },
    pendientes: []
  },
  'CR-02': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §5.2 y §13',
    entrada: { textoFuncion: '1 + x^2', textoA: '-1', textoB: '2' },
    esperado: {
      antiderivada: 'x + x³/3',
      Fb: exacta(14n, 3n),
      Fa: exacta(-4n, 3n),
      I: exacta(6n),
      Ageo: exacta(6n),
      fProm: exacta(2n),
      aptitudEnMetros: { apta: true } // «en metros, perfil válido»
    },
    pendientes: []
  },
  'CR-03': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §7.1, §7.2 y §13; design §9',
    entrada: {
      textoFuncion: '2 + x^2/4', textoA: '0', textoB: '4', interpretacion: 'fisica',
      textoPrecio: '50', textoAdicional: '10'
    },
    esperado: {
      antiderivada: '2x + x³/12',
      Fb: exacta(40n, 3n),
      Fa: exacta(0n),
      // f(x) ≥ 2 > 0, así que A_geo = I (formulario §7.1).
      I: exacta(40n, 3n, '≈ 13.3333'),
      Ageo: exacta(40n, 3n, '≈ 13.3333'),
      fProm: exacta(10n, 3n, '≈ 3.3333'),
      unidades: { area: 'm²', fProm: 'm' },
      rectangulo: { base: exacta(4n), altura: exacta(10n, 3n), area: exacta(40n, 3n) },
      aptitudEnMetros: { apta: true },
      estimacion: {
        areaUtil: exacta(40n, 3n),
        areaEstimada: exacta(44n, 3n, '≈ 14.6667'),
        costoBase: exacta(2000n, 3n, 'Q666.67'),
        costoEstimado: exacta(2200n, 3n, 'Q733.33'),
        // Redondeo prematuro (formulario §7.2): nunca deben aparecer.
        costosIncorrectos: ['Q666.50', 'Q733.15', 'Q733.50']
      }
    },
    pendientes: []
  },
  'CR-04': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §10.2 y §13; design §8; tasks T-04',
    entrada: { textoFuncion: 'x^2', textoA: '0', textoB: '3' },
    esperado: {
      // La fuente da «9»: I y A_geo coinciden porque x² ≥ 0 (formulario §2).
      I: exacta(9n),
      Ageo: exacta(9n),
      fProm: exacta(3n),
      ceros: [{ valor: exacta(0n), multiplicidad: 2, tipo: 'extremo' }]
    },
    pendientes: []
  },
  'CR-05': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §2 y §13',
    entrada: { textoFuncion: 'x', textoA: '-1', textoB: '1' },
    esperado: {
      antiderivada: 'x²/2',
      I: exacta(0n),
      Ageo: exacta(1n),
      fProm: exacta(0n),
      ceros: [{ valor: exacta(0n), tipo: 'cambio-signo' }],
      tramos: [
        { desde: exacta(-1n), hasta: exacta(0n), integral: exacta(-1n, 2n), valorAbsoluto: exacta(1n, 2n) },
        { desde: exacta(0n), hasta: exacta(1n), integral: exacta(1n, 2n), valorAbsoluto: exacta(1n, 2n) }
      ],
      advertencias: ['W-01'],
      aptitudEnMetros: { apta: false, codigo: 'E-MOD-02' }
    },
    pendientes: []
  },
  'CR-06': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §2 y §13; tasks T-04',
    entrada: { textoFuncion: '-2', textoA: '0', textoB: '3' },
    esperado: {
      I: exacta(-6n),
      Ageo: exacta(6n),
      fProm: exacta(-2n),
      ceros: [], // «sin ceros» (tasks T-04)
      rectangulo: null, // «sin rectángulo»
      aptitudEnMetros: { apta: false, codigo: 'E-MOD-02' }
    },
    pendientes: []
  },
  'CR-07': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §2 y §13',
    // Dos entradas equivalentes: mismo modelo y resultados idénticos (R-02.3).
    entradas: [
      { textoFuncion: '(x-1)^2', textoA: '0', textoB: '2' },
      { textoFuncion: 'x^2 - 2x + 1', textoA: '0', textoB: '2' }
    ],
    esperado: {
      I: exacta(2n, 3n),
      Ageo: exacta(2n, 3n),
      fProm: exacta(1n, 3n),
      // Tangencia: raíz doble sin cambio de signo (requirements §5; formulario §2.1).
      ceros: [{ valor: exacta(1n), multiplicidad: 2, tipo: 'tangencia' }],
      advertencias: ['W-02']
    },
    pendientes: []
  },
  'CR-08': {
    prioridad: 'MVP',
    fuentes: 'requirements §14 y R-05.5; formulario §13; tasks T-04',
    entrada: { textoFuncion: '0', textoA: '0', textoB: '4' },
    esperado: {
      identicamenteCero: true,
      I: exacta(0n),
      Ageo: exacta(0n),
      fProm: exacta(0n),
      ceros: [], // R-05.5: no se listan ceros individuales
      advertencias: ['W-09'],
      aptitudEnMetros: { apta: false, codigo: 'E-MOD-03' }
    },
    pendientes: []
  },
  'CR-09': {
    prioridad: 'COMP',
    fuentes: 'requirements §14; formulario §8 y §13',
    entrada: { tipo: 'rectangulo', unidad: 'm', base: '4', altura: '2' },
    esperado: { area: exacta(8n), unidadArea: 'm²', areaM2: exacta(8n) },
    pendientes: []
  },
  'CR-10': {
    prioridad: 'COMP',
    fuentes: 'requirements §14; formulario §8 y §13',
    entrada: { tipo: 'rectangulo', unidad: 'cm', base: '100', altura: '200' },
    esperado: { area: exacta(20000n), unidadArea: 'cm²', areaM2: exacta(2n) },
    pendientes: []
  },
  'CR-11': {
    prioridad: 'MVP',
    fuentes: 'requirements §14 y R-01.6',
    subcasos: [
      { entrada: { textoA: '2', textoB: '2' }, esperado: { errores: ['E-INT-01'] } },
      { entrada: { textoA: '3', textoB: '1' }, esperado: { errores: ['E-INT-02'] } }
    ],
    esperado: { sinReordenar: true },
    pendientes: [
      'textoFuncion: la fuente no fija la función; el error esperado no depende de ella si es válida.'
    ]
  },
  'CR-12': {
    prioridad: 'MVP',
    fuentes: 'requirements §14',
    entrada: { textoFuncion: '1/x', textoA: '-1', textoB: '1' },
    esperado: { errores: ['E-EXP-08'], sinArea: true }, // «nunca un área finita»
    pendientes: []
  },
  'CR-13': {
    prioridad: 'MVP',
    fuentes: 'requirements §14',
    subcasos: [
      { entrada: { textoFuncion: '' }, esperado: { errores: ['E-EXP-01'] } },
      { entrada: { textoFuncion: 'y + 1' }, esperado: { errores: ['E-EXP-03'] } },
      { entrada: { textoLimite: 'Infinity' }, esperado: { errores: ['E-NUM-03'] } }
    ],
    esperado: { sinResultadosAnteriores: true },
    pendientes: [
      'textoA y textoB de los dos primeros subcasos: la fuente no fija el intervalo.',
      'Tercer subcaso: la fuente no fija la función ni si «Infinity» va en a o en b.',
      'Cálculo previo cuyo resultado no debe quedar visible: la fuente no lo fija.'
    ]
  },
  'CR-14': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §2 y §13',
    entrada: { textoFuncion: 'x^3 - x', textoA: '-2', textoB: '2' },
    esperado: {
      I: exacta(0n),
      Ageo: exacta(5n),
      fProm: exacta(0n),
      ceros: [
        { valor: exacta(-1n), tipo: 'cambio-signo' },
        { valor: exacta(0n), tipo: 'cambio-signo' },
        { valor: exacta(1n), tipo: 'cambio-signo' }
      ],
      // El formulario da los tramos sin signo, en orden; suman A_geo = 5.
      valoresAbsolutosTramos: [exacta(9n, 4n), exacta(1n, 4n), exacta(1n, 4n), exacta(9n, 4n)]
    },
    pendientes: []
  },
  'CR-15': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §2 y §13; design §8, paso 5.5',
    entrada: { textoFuncion: 'x^2 - 2', textoA: '0', textoB: '2' },
    esperado: {
      I: exacta(-4n, 3n),
      Ageo: aproximada('≈ 2.4379', '(8√2 − 4)/3'),
      fProm: exacta(-2n, 3n),
      // Cero irracional y simple, así que cambia de signo (design §8, paso 5.5).
      // requirements da ≈ 1.4142; el formulario, √2 ≈ 1.414214.
      ceros: [{ valor: aproximada('≈ 1.4142', '√2'), tipo: 'cambio-signo' }],
      advertencias: ['W-04']
    },
    pendientes: []
  },
  'CR-16': {
    prioridad: 'MVP',
    fuentes: 'requirements §14 y R-02.3',
    // «Mismo modelo y resultados que CR-03»: se usan su intervalo y su interpretación.
    entradas: [
      { textoFuncion: 'x^2/4 + 2', textoA: '0', textoB: '4', interpretacion: 'fisica' },
      { textoFuncion: '0.25x^2 + 2', textoA: '0', textoB: '4', interpretacion: 'fisica' },
      { textoFuncion: '(1/4)x^2 + 2', textoA: '0', textoB: '4', interpretacion: 'fisica' },
      { textoFuncion: '2 + x*x/4', textoA: '0', textoB: '4', interpretacion: 'fisica' }
    ],
    esperado: { mismoQue: 'CR-03' },
    pendientes: []
  },
  'CR-17': {
    prioridad: 'MVP',
    fuentes: 'requirements §14 y R-03.2; tasks T-02',
    entrada: { textoFuncion: '0.1 + 0.2', textoA: '0', textoB: '1' },
    esperado: {
      suma: exacta(3n, 10n), // 0.1 + 0.2 = 3/10 (tasks T-02)
      I: exacta(3n, 10n, '= 0.3')
    },
    pendientes: []
  },
  'CR-18': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §6, donde I = A_geo en los cuatro',
    subcasos: [
      {
        entrada: { textoFuncion: 'x^2', textoA: '1', textoB: '3' },
        esperado: { I: exacta(26n, 3n, '≈ 8.6667'), Ageo: exacta(26n, 3n, '≈ 8.6667'), fProm: exacta(13n, 3n, '≈ 4.3333') }
      },
      {
        entrada: { textoFuncion: '3x^2', textoA: '1', textoB: '4' },
        esperado: { I: exacta(63n), Ageo: exacta(63n), fProm: exacta(21n) }
      },
      {
        entrada: { textoFuncion: '5x - x^2', textoA: '0', textoB: '5' },
        esperado: {
          I: exacta(125n, 6n, '≈ 20.8333'), Ageo: exacta(125n, 6n, '≈ 20.8333'), fProm: exacta(25n, 6n, '≈ 4.1667'),
          ceros: [{ valor: exacta(0n), tipo: 'extremo' }, { valor: exacta(5n), tipo: 'extremo' }]
        }
      },
      {
        entrada: { textoFuncion: '5x^3 - 2', textoA: '2', textoB: '5' },
        esperado: { I: exacta(3021n, 4n, '= 755.25'), Ageo: exacta(3021n, 4n, '= 755.25'), fProm: exacta(1007n, 4n, '= 251.75') }
      }
    ],
    pendientes: []
  },
  'CR-19': {
    prioridad: 'COMP',
    fuentes: 'requirements §14; formulario §8 y §13; tasks T-07 y T-D1',
    subcasos: [
      {
        entrada: { tipo: 'triangulo', unidad: 'm', base: '4', altura: '3' },
        esperado: { area: exacta(6n), unidadArea: 'm²' }
      },
      {
        entrada: { tipo: 'circulo', unidad: 'm', radio: '5' },
        esperado: { area: multiploPi(25n, 1n, '≈ 78.5398'), unidadArea: 'm²' }
      },
      {
        prioridad: 'DESEABLE', // trapecio pospuesto (T-D1)
        entrada: { tipo: 'trapecio', unidad: 'm', baseMayor: '6', baseMenor: '4', altura: '2' },
        esperado: { area: exacta(10n), unidadArea: 'm²' }
      },
      { entrada: { textoDimension: '0' }, esperado: { errores: ['E-NUM-06'] } }
    ],
    pendientes: [
      'Cuarto subcaso: la fuente no fija la figura ni cuál de sus dimensiones vale 0.'
    ]
  },
  'CR-20': {
    prioridad: 'MVP',
    fuentes: 'requirements §14 y R-17.4',
    // CR-03 con precio 0 y adicional 0.
    entrada: {
      textoFuncion: '2 + x^2/4', textoA: '0', textoB: '4', interpretacion: 'fisica',
      textoPrecio: '0', textoAdicional: '0'
    },
    esperado: {
      estimacion: {
        areaEstimada: exacta(40n, 3n),
        // La fuente da un solo importe, «Q0.00»; con precio 0 corresponde a ambos costos.
        costoBase: exacta(0n, 1n, 'Q0.00'),
        costoEstimado: exacta(0n, 1n, 'Q0.00')
      }
    },
    pendientes: []
  },
  'CR-21': {
    prioridad: 'MVP',
    fuentes: 'requirements §14 y §9 (Tabla 9.1)',
    subcasos: [
      { entrada: { textoFuncion: 'sqrt(x)' }, esperado: { errores: ['E-EXP-06'] } },
      { entrada: { textoFuncion: 'x^4' }, esperado: { errores: ['E-EXP-10'] } },
      { entrada: { textoFuncion: 'x^(1/2)' }, esperado: { errores: ['E-EXP-07'] } },
      { entrada: { textoFuncion: 'x/x' }, esperado: { errores: ['E-EXP-08'] } },
      { entrada: { textoFuncion: 'f(x)=x^2' }, esperado: { errores: ['E-EXP-12'] } },
      { entrada: { textoFuncion: '0,5x' }, esperado: { errores: ['E-EXP-04'] } },
      { entrada: { textoFuncion: 'X^2' }, esperado: { errores: ['E-EXP-03'] } },
      { entrada: { longitudFuncion: 201 }, esperado: { errores: ['E-EXP-11'] } }
    ],
    pendientes: [
      'Último subcaso: la fuente fija la longitud del texto (201 caracteres), no su contenido.',
      'textoA y textoB: la fuente no fija el intervalo; los errores son del campo de la función.'
    ]
  },
  'CR-22': {
    prioridad: 'MVP',
    fuentes: 'requirements §14 y R-12.1; tasks T-13',
    secuencia: [
      { accion: 'calcular', caso: 'CR-03' },
      { accion: 'editar', campo: 'textoB', valor: '5' }
    ],
    // «resultados, gráfica, pasos y estimación retirados o desactualizados»
    esperado: { retirados: ['resultado', 'grafica', 'pasos', 'estimacion'] },
    pendientes: []
  },
  'CR-23': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §8 (comprobación cruzada)',
    subcasos: [
      {
        entrada: { textoFuncion: '2', textoA: '0', textoB: '4', interpretacion: 'fisica' },
        esperado: { Ageo: exacta(8n), unidadArea: 'm²', igualA: 'CR-09' }
      },
      {
        entrada: { textoFuncion: '(3/4)x', textoA: '0', textoB: '4', interpretacion: 'fisica' },
        esperado: { Ageo: exacta(6n), unidadArea: 'm²', igualA: 'triángulo de CR-19' }
      }
    ],
    pendientes: []
  },
  'CR-27': {
    prioridad: 'MVP',
    fuentes: 'requirements §14 y §9 (D-02 y D-03)',
    entradas: [
      { textoFuncion: 'x(x+1)', textoA: '0', textoB: '1' },
      { textoFuncion: 'x*(x+1)', textoA: '0', textoB: '1' }
    ],
    esperado: {
      modelo: 'x² + x', // el mismo para las dos entradas
      I: exacta(5n, 6n),
      Ageo: exacta(5n, 6n),
      fProm: exacta(5n, 6n)
    },
    pendientes: []
  },
  'CR-28': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §13',
    entrada: { textoFuncion: '(x - 1/3)(x - 2)(x + 1)', textoA: '0', textoB: '3' },
    esperado: {
      ceros: [
        { valor: exacta(1n, 3n), tipo: 'cambio-signo' },
        { valor: exacta(2n), tipo: 'cambio-signo' }
      ],
      I: exacta(11n, 4n),
      Ageo: exacta(5923n, 972n, '≈ 6.0936'),
      fProm: exacta(11n, 12n)
    },
    pendientes: []
  },
  'CR-29': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §2.1 y §13; design §8 (registro único)',
    entrada: { textoFuncion: '(x-1)^3', textoA: '0', textoB: '2' },
    esperado: {
      ceros: [{ valor: exacta(1n), multiplicidad: 3, tipo: 'cambio-signo' }],
      I: exacta(0n),
      Ageo: exacta(1n, 2n),
      fProm: exacta(0n)
    },
    pendientes: []
  },
  'CR-30': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §13; design §8 (registro único)',
    entrada: { textoFuncion: '(x-1)^2(x+2)', textoA: '-3', textoB: '2' },
    esperado: {
      ceros: [
        { valor: exacta(-2n), multiplicidad: 1, tipo: 'cambio-signo' },
        { valor: exacta(1n), multiplicidad: 2, tipo: 'tangencia' }
      ],
      I: exacta(5n, 4n),
      Ageo: exacta(59n, 4n, '= 14.75'),
      fProm: exacta(1n, 4n)
    },
    pendientes: []
  },
  'CR-31': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §2 y §13',
    entrada: { textoFuncion: 'x - 1/3', textoA: '0', textoB: '1' },
    esperado: {
      antiderivada: 'x²/2 − x/3',
      Fa: exacta(0n),
      FenRaiz: exacta(-1n, 18n), // F(1/3)
      Fb: exacta(1n, 6n),
      ceros: [{ valor: exacta(1n, 3n), tipo: 'cambio-signo' }],
      tramos: [
        { desde: exacta(0n), hasta: exacta(1n, 3n), integral: exacta(-1n, 18n), valorAbsoluto: exacta(1n, 18n) },
        { desde: exacta(1n, 3n), hasta: exacta(1n), integral: exacta(2n, 9n), valorAbsoluto: exacta(2n, 9n) }
      ],
      I: exacta(1n, 6n),
      Ageo: exacta(5n, 18n, '≈ 0.2778'), // rotulada exacta
      fProm: exacta(1n, 6n)
    },
    pendientes: []
  },
  'CR-32': {
    prioridad: 'MVP',
    fuentes: 'requirements §14 y §9; formulario §13; tasks T-10',
    entrada: { textoFuncion: '(0.000001x)^3', textoA: '-1', textoB: '1' },
    esperado: {
      admitida: true,
      coeficiente: exacta(1n, 10n ** 18n), // coeficiente normalizado (requirements §9)
      ceros: [{ valor: exacta(0n), multiplicidad: 3, tipo: 'cambio-signo' }],
      I: exacta(0n),
      // Exacta; se muestra «≈ 0.0000» junto a la fracción.
      Ageo: exacta(1n, 2n * 10n ** 18n, '≈ 0.0000'),
      fProm: exacta(0n)
    },
    pendientes: []
  },
  'CR-33': {
    prioridad: 'MVP',
    fuentes: 'requirements §14 y R-21.3; design §8, paso 6',
    entrada: {
      textoFuncion: 'x^3 + 0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*0.000001*x - 2',
      textoA: '0',
      textoB: '2'
    },
    esperado: {
      longitudFuncion: 101,
      biseccionesNecesarias: 201, // para la prueba de racionalidad
      errores: ['E-SIS-01'],
      sinResultados: true // sin resultados, pasos ni gráfica
    },
    pendientes: []
  },
  'CR-34': {
    prioridad: 'MVP',
    fuentes: 'requirements §14 y R-05.3',
    entrada: {
      textoFuncion: '(x - (1/999983)^3*(1/999983)^3*(1/999983)^3*(1/999983)^3*(1/999983)^3*(1/999983)^3*(1/999983)^3)(x^2 + 1)',
      textoA: '0',
      textoB: '1'
    },
    esperado: {
      longitudFuncion: 105,
      errores: ['E-SIS-01'],
      // Existe, pero no puede verificarse en 200 bisecciones: nunca se muestra como aproximada.
      raizRacional: exacta(1n, 999983n ** 21n),
      nuncaAproximada: true,
      sinResultados: true
    },
    pendientes: []
  },
  'CR-35': {
    prioridad: 'MVP',
    fuentes: 'requirements §14; formulario §2.1 y §13; design §8, paso 2',
    entrada: {
      textoFuncion: '1000000^3*1000000^3*1000000^3*1000000*(x - 1/3)(x^2 + 1)',
      textoA: '0',
      textoB: '1'
    },
    esperado: {
      coeficienteA: 3n, // A de la parte primitiva
      ceros: [{ valor: exacta(1n, 3n) }],
      // La fuente escribe 10⁶⁰·11/36 y 10⁶⁰·407/972. Aquí van irreducibles:
      // 10⁶⁰·11/36 = 275·10⁵⁸/9 y 10⁶⁰·407/972 = 10175·10⁵⁸/243.
      I: exacta(275n * 10n ** 58n, 9n),
      Ageo: exacta(10175n * 10n ** 58n, 243n),
      fProm: exacta(275n * 10n ** 58n, 9n)
    },
    pendientes: []
  },
  'CR-36': {
    prioridad: 'MVP',
    fuentes: 'requirements §14 y §12; formulario §13; design §8, paso 6',
    entrada: {
      textoFuncion: '1000000^3*1000000^3*1000000^3*1000000^3*1000000^3*1000000^3*1000000^3*(x^3 - 2)',
      textoA: '0',
      textoB: '2'
    },
    esperado: {
      ceros: [{ valor: aproximada(undefined, '∛2'), tipo: 'cambio-signo' }],
      I: exacta(0n),
      Ageo: aproximada(undefined, '3·∛2·10¹²⁶'),
      advertencias: ['W-04'],
      // La cota obtenida es mayor que 10⁻¹² y el error real es menor que la cota.
      cota: { mayorQue: '10⁻¹²', errorMenorQueCota: true }
    },
    pendientes: []
  }
});
