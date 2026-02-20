'use client';

import { useEffect } from 'react';

export default function TooltipFormatter() {
  useEffect(() => {
    // Mapa de colores para leyendas
    const colorMap: Record<string, string> = {
      cyan: '#4A8B9B',
      violet: '#7B6FA0',
      fuchsia: '#967198',
      emerald: '#528C72',
      amber: '#B89B52',
      rose: '#B06060',
      slate: '#6B7B8D',
      blue: '#5078A8',
      indigo: '#636BA0',
      teal: '#4F8E86',
      green: '#5A8F5A',
      purple: '#7E6BA8',
      orange: '#C08050',
      red: '#B85555',
      yellow: '#B8A44A',
      sky: '#5A8EB0',
      lime: '#7A9E50',
      pink: '#B06080',
    };

    // Función para formatear tooltips
    const formatTooltips = () => {
      // Formatear tooltips de Recharts
      const rechartsTooltips = document.querySelectorAll('.recharts-default-tooltip .recharts-tooltip-item');
      rechartsTooltips.forEach((item) => {
        const nameEl = item.querySelector('.recharts-tooltip-item-name');
        const valueEl = item.querySelector('.recharts-tooltip-item-value');
        if (nameEl && valueEl) {
          const nameText = nameEl.textContent || '';
          const valueText = valueEl.textContent || '';
          // Si el nombre termina sin espacio y el valor empieza con $, está bien por el layout flex
          // Pero si están concatenados en el mismo elemento, necesitamos separarlos
        }
      });

      // Formatear tooltips de Tremor
      const tremorTooltips = document.querySelectorAll('[class*="tremor-ChartTooltip"] p:not(:first-child), [class*="chartTooltip"] p:not(:first-child)');
      tremorTooltips.forEach((p) => {
        const text = p.textContent || '';
        // Si el texto contiene "$" sin espacio antes (ej: "Ingresos$1,000")
        if (text.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]\$/)) {
          // Reemplazar texto sin espacio antes de $ con espacio
          const formatted = text.replace(/([a-zA-ZáéíóúÁÉÍÓÚñÑ])(\$)/g, '$1: $2');
          if (formatted !== text) {
            // Si hay spans, actualizar el texto del span que contiene el valor
            const spans = p.querySelectorAll('span');
            if (spans.length >= 2) {
              // Ya está en formato correcto con spans separados
              return;
            } else {
              // El texto está concatenado, necesitamos separarlo
              // Intentar dividir en nombre y valor
              const match = text.match(/^([^$]+)(\$.*)$/);
              if (match) {
                const [, name, value] = match;
                p.innerHTML = `<span style="color: #94A3B8; font-weight: 400; margin-right: 8px;">${name.trim()}</span><span style="color: #F8FAFC; font-weight: 600;">${value}</span>`;
              }
            }
          }
        }
      });
    };

    // Función para arreglar círculos de leyenda
    const fixLegendCircles = () => {
      const legendItems = document.querySelectorAll('.tremor-Legend-legendItem');
      legendItems.forEach((item) => {
        const circle = item.querySelector('svg circle');
        if (circle) {
          // Obtener el color del elemento padre o del atributo data-color
          const colorAttr = item.getAttribute('data-color') || 
                           item.getAttribute('data-tremor-color') ||
                           (item as HTMLElement).style.color?.replace('var(--chart-', '').replace(')', '');
          
          // Intentar obtener el color del texto o del estilo
          let colorName = '';
          if (colorAttr) {
            colorName = colorAttr;
          } else {
            // Buscar en las clases
            const classes = item.className;
            for (const [key, value] of Object.entries(colorMap)) {
              if (classes.includes(key)) {
                colorName = key;
                break;
              }
            }
          }

          // Si encontramos un color, aplicarlo
          if (colorName && colorMap[colorName]) {
            circle.setAttribute('fill', colorMap[colorName]);
            circle.setAttribute('r', '4');
            circle.setAttribute('cx', '4');
            circle.setAttribute('cy', '4');
          } else if (!circle.getAttribute('fill') || circle.getAttribute('fill') === '') {
            // Color por defecto
            circle.setAttribute('fill', colorMap.slate);
          }

          // Asegurar que el SVG tenga el tamaño correcto
          const svg = circle.closest('svg');
          if (svg) {
            svg.setAttribute('width', '12');
            svg.setAttribute('height', '12');
            svg.setAttribute('viewBox', '0 0 8 8');
          }
        }

        // Asegurar que el texto sea visible
        const textElements = item.querySelectorAll('span, *:not(svg)');
        textElements.forEach((el) => {
          if (el.textContent && el.textContent.trim()) {
            (el as HTMLElement).style.color = '#374151';
            (el as HTMLElement).style.fontSize = '12px';
            (el as HTMLElement).style.marginLeft = '6px';
          }
        });
      });
    };

    // Ejecutar inmediatamente
    formatTooltips();
    fixLegendCircles();

    // Observar cambios en el DOM para formatear tooltips nuevos y arreglar leyendas
    const observer = new MutationObserver(() => {
      formatTooltips();
      fixLegendCircles();
    });

    // Observar el body para detectar cuando aparecen tooltips o leyendas
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-color'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}

