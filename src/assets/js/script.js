/**
 * Lógica funcional de la Calculadora Premium
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const displayExpression = document.getElementById('calc-expression');
    const displayCurrent = document.getElementById('calc-current-val');
    const historyList = document.querySelector('.history-list');

    // --- VARIABLES DE ESTADO ---
    let expression = '';      // Expresión matemática completa (ej: "12+45-2")
    let currentValue = '';    // Número que se está digitando actualmente
    let isCalculated = false;  // Bandera para saber si acabamos de calcular un resultado
    let history = [];         // Array para guardar los últimos 10 registros de cálculos

    // Inicializar visualización limpia
    clearDisplay();
    renderHistory();

    // --- MANEJO DE BOTONES EN PANTALLA ---

    // Números (1-9)
    for (let i = 1; i <= 9; i++) {
        const btn = document.getElementById(`btn-${i}`);
        if (btn) {
            btn.addEventListener('click', () => appendNumber(String(i)));
        }
    }

    // Operadores
    const btnAdd = document.getElementById('btn-add');
    const btnSubtract = document.getElementById('btn-subtract');
    const btnDivide = document.getElementById('btn-divide');
    const btnMultiply = document.getElementById('btn-multiply');

    if (btnAdd) btnAdd.addEventListener('click', () => appendOperator('+'));
    if (btnSubtract) btnSubtract.addEventListener('click', () => appendOperator('-'));
    if (btnDivide) btnDivide.addEventListener('click', () => appendOperator('/'));
    if (btnMultiply) btnMultiply.addEventListener('click', () => appendOperator('x'));

    // Acciones especiales
    const btnCalc = document.getElementById('btn-calc');
    const btnClear = document.getElementById('btn-clear');
    const btnBackspace = document.getElementById('btn-backspace');

    if (btnCalc) btnCalc.addEventListener('click', calculate);
    if (btnClear) btnClear.addEventListener('click', clearDisplay);
    if (btnBackspace) btnBackspace.addEventListener('click', backspace);

    // --- FUNCIONES CORE DE LA CALCULADORA ---

    // Añadir número
    function appendNumber(num) {
        // Si acabamos de calcular y el usuario digita un número nuevo, reseteamos la pantalla
        if (isCalculated) {
            expression = '';
            currentValue = '';
            isCalculated = false;
        }

        currentValue += num;
        expression += num;
        updateScreen();
    }

    // Añadir operador
    function appendOperator(op) {
        if (isCalculated) {
            isCalculated = false;
        }

        // Si la expresión está vacía y se presiona un operador, no hacer nada
        if (expression === '') {
            return;
        }

        // Si el último carácter es un operador, reemplazarlo
        const lastChar = expression.trim().slice(-1);
        if (['+', '-', '/', 'x'].includes(lastChar)) {
            expression = expression.trim().slice(0, -1) + ' ' + op + ' ';
        } else {
            expression += ' ' + op + ' ';
        }

        currentValue = '';
        updateScreen();
    }

    // Calcular resultado
    function calculate() {
        if (expression === '' || isCalculated) return;

        // Comprobar si termina en un operador y limpiarlo
        let evalExpr = expression.trim();
        const lastChar = evalExpr.slice(-1);
        if (['+', '-', '/', 'x'].includes(lastChar)) {
            evalExpr = evalExpr.slice(0, -1).trim();
        }

        // Reemplazar la representación visual 'x' por '*' para poder evaluar matemáticamente
        let formattedExpr = evalExpr.replace(/x/g, '*');

        try {
            // Validación de seguridad para evaluar la expresión
            if (!/^[0-9.+\-%*/\s]+$/.test(formattedExpr)) {
                throw new Error("Entrada inválida");
            }

            // Realizar el cálculo de forma segura
            let result = new Function(`return (${formattedExpr})`)();

            // Formatear decimales en caso de haberlos para evitar overflow decimal
            if (typeof result === 'number' && !Number.isInteger(result)) {
                result = parseFloat(result.toFixed(8));
            }

            // Validar división por cero o resultados no numéricos
            if (result === Infinity || result === -Infinity || isNaN(result)) {
                throw new Error("División por cero");
            }

            // Añadir cálculo al historial propio
            addToHistory(evalExpr, result);

            // Mostrar la alerta flotante de tipo de operación con Bootstrap
            showOperationAlert(evalExpr);

            // Actualizar variables
            displayExpression.textContent = evalExpr + ' =';
            displayCurrent.textContent = result;

            expression = String(result);
            currentValue = String(result);
            isCalculated = true;

        } catch (error) {
            displayCurrent.textContent = 'Error';
            expression = '';
            currentValue = '';
            isCalculated = true;
        }
    }

    // Reiniciar
    function clearDisplay() {
        expression = '';
        currentValue = '';
        isCalculated = false;
        displayExpression.textContent = '';
        displayCurrent.textContent = '0';
    }

    // Borrar último carácter
    function backspace() {
        if (isCalculated) {
            clearDisplay();
            return;
        }

        expression = expression.trim();
        if (expression.length > 0) {
            // Si el último es un espacio (operador), removemos el operador y sus espacios
            if (expression.endsWith('+') || expression.endsWith('-') || expression.endsWith('/') || expression.endsWith('x')) {
                expression = expression.slice(0, -1).trim();
            } else {
                expression = expression.slice(0, -1);
            }

            // Reconstruir currentValue
            const parts = expression.split(/\s+/);
            currentValue = parts[parts.length - 1];
            if (['+', '-', '/', 'x'].includes(currentValue)) {
                currentValue = '';
            }

            updateScreen();
        }
    }

    // Actualizar elementos visuales de la pantalla
    function updateScreen() {
        displayExpression.textContent = expression;

        // Si hay una cifra actual en escritura, la mostramos en grande
        if (currentValue !== '') {
            displayCurrent.textContent = currentValue;
        } else {
            // Si no, mostramos el último número en la expresión completa
            const parts = expression.trim().split(/\s+/);
            const lastPart = parts[parts.length - 1];
            if (lastPart && !['+', '-', '/', 'x'].includes(lastPart)) {
                displayCurrent.textContent = lastPart;
            } else {
                displayCurrent.textContent = '0';
            }
        }
    }

    // --- SISTEMA DE HISTORIAL PROPIO ---

    // Añadir al registro de historial propio
    function addToHistory(expr, result) {
        const item = {
            expr: expr + ' =',
            result: String(result)
        };

        // Agregar al inicio del historial
        history.unshift(item);

        // Limitar a máximo 10 registros
        if (history.length > 10) {
            history.pop();
        }

        renderHistory();
    }

    // Renderizar la lista de historial
    function renderHistory() {
        historyList.innerHTML = '';

        if (history.length === 0) {
            // Mensaje informativo si está vacío
            const placeholder = document.createElement('div');
            placeholder.style.color = 'var(--text-muted)';
            placeholder.style.fontSize = '0.9rem';
            placeholder.style.textAlign = 'center';
            placeholder.style.padding = '20px 0';
            placeholder.style.fontStyle = 'italic';
            placeholder.textContent = 'Sin registros aún';
            historyList.appendChild(placeholder);
            return;
        }

        history.forEach((calc, index) => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.setAttribute('role', 'listitem');
            historyItem.setAttribute('tabindex', '0');
            historyItem.setAttribute('title', 'Cargar resultado en la calculadora');

            const exprSpan = document.createElement('span');
            exprSpan.classList.add('history-expr');
            // Reemplazar asteriscos por cruz de multiplicar y barra por división para estética
            exprSpan.textContent = calc.expr;

            const resultSpan = document.createElement('span');
            resultSpan.classList.add('history-result');
            resultSpan.textContent = calc.result;

            historyItem.appendChild(exprSpan);
            historyItem.appendChild(resultSpan);

            // Al hacer clic en un ítem del historial, se carga su resultado para seguir calculando
            historyItem.addEventListener('click', () => {
                loadHistoryValue(calc.result);
            });

            historyItem.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    loadHistoryValue(calc.result);
                }
            });

            historyList.appendChild(historyItem);
        });
    }

    // Cargar valor del historial a la pantalla activa
    function loadHistoryValue(value) {
        expression = value;
        currentValue = value;
        isCalculated = false;
        updateScreen();
    }

    // --- ALERTAS DE OPERACIONES CON BOOTSTRAP ---
    function showOperationAlert(expr) {
        const container = document.getElementById('alert-container');
        if (!container) return;

        // Detectar los operadores activos en la expresión
        const hasAdd = expr.includes('+');
        const hasSub = expr.includes('-');
        const hasMul = expr.includes('x') || expr.includes('*');
        const hasDiv = expr.includes('/');

        let alertClass = 'alert-secondary';
        let title = 'Operación Aritmética';
        let text = 'Se ha realizado un cálculo en la calculadora.';

        // Contar tipos de operadores
        const activeOperators = [hasAdd, hasSub, hasMul, hasDiv].filter(Boolean).length;

        if (activeOperators > 1) {
            alertClass = 'alert-secondary';
            title = 'Operación Combinada';
            text = 'Has realizado un cálculo que involucra múltiples tipos de operaciones matemáticas básicas.';
        } else if (hasAdd) {
            alertClass = 'alert-success';
            title = 'Suma (Adición)';
            text = 'La suma reúne dos o más cantidades para obtener un total acumulado.';
        } else if (hasSub) {
            alertClass = 'alert-info';
            title = 'Resta (Sustracción)';
            text = 'La sustracción determina la diferencia al quitar una cantidad de otra.';
        } else if (hasMul) {
            alertClass = 'alert-warning';
            title = 'Multiplicación (Producto)';
            text = 'Representa sumar un valor repetidamente según indique el otro.';
        } else if (hasDiv) {
            alertClass = 'alert-primary';
            title = 'División';
            text = 'La división reparte una cantidad total en partes o grupos iguales.';
        }

        // Crear el contenedor de la alerta
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${alertClass} alert-dismissible fade show border-0 shadow mb-2`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.style.borderRadius = '12px';
        alertDiv.style.minWidth = '280px';
        alertDiv.style.transition = 'all 0.3s ease';

        alertDiv.innerHTML = `
            <div class="d-flex flex-column text-start">
                <strong class="mb-1 d-flex align-items-center" style="font-size: 0.95rem;">
                    <span class="me-2" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: currentColor;"></span>
                    ${title}
                </strong>
                <span style="font-size: 0.8rem; line-height: 1.4; color: #333;">${text}</span>
            </div>
            <button type="button" class="btn-close" aria-label="Cerrar" style="font-size: 0.65rem; padding: 1.1rem 1rem;"></button>
        `;

        // Asignar el botón de cierre manualmente para garantizar robustez total sin depender de JS externo de Bootstrap
        const closeBtn = alertDiv.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                alertDiv.classList.remove('show');
                // IMPORTANTE: Aquí restauramos a 250ms para que se remueva del DOM
                // en cuanto termine la animación de desvanecimiento (fade).
                setTimeout(() => alertDiv.remove(), 250);
            });
        }

        container.appendChild(alertDiv);

        // Auto-remover a los 4 segundos (4000ms). Puedes modificar el 4000 de abajo para cambiar la duración.
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.classList.remove('show');
                // IMPORTANTE: Aquí restauramos a 250ms para remover tras el desvanecimiento.
                setTimeout(() => alertDiv.remove(), 250);
            }
        }, 4000);
    }

    // --- COMPATIBILIDAD CON TECLADO FÍSICO ---
    const keyMap = {
        '1': 'btn-1', '2': 'btn-2', '3': 'btn-3',
        '4': 'btn-4', '5': 'btn-5', '6': 'btn-6',
        '7': 'btn-7', '8': 'btn-8', '9': 'btn-9',
        '+': 'btn-add', '-': 'btn-subtract', '/': 'btn-divide',
        'x': 'btn-multiply', '*': 'btn-multiply',
        'Enter': 'btn-calc', '=': 'btn-calc',
        'Escape': 'btn-clear', 'c': 'btn-clear', 'C': 'btn-clear',
        'Backspace': 'btn-backspace'
    };

    document.addEventListener('keydown', (event) => {
        // Ignorar combinaciones del sistema y del navegador (Ctrl+R, F5, F12, etc.)
        if (event.ctrlKey || event.altKey || event.metaKey || event.key === 'F12' || event.key === 'F5' || event.key === 'Tab') {
            return;
        }

        const buttonId = keyMap[event.key];
        if (buttonId) {
            event.preventDefault();
            const btn = document.getElementById(buttonId);
            if (btn) {
                // Simular efecto visual activo de pulsación en teclado
                btn.style.transform = 'scale(0.94)';
                btn.style.boxShadow = 'none';
                setTimeout(() => {
                    btn.style.transform = '';
                    btn.style.boxShadow = '';
                }, 100);

                // Disparar evento clic
                btn.click();
            }
        }
    });
});
