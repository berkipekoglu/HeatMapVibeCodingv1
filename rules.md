# Kod Stili ve Yapısı

- Çalışan altyapıyı bozmadan yeni eklemeleri yapmalısın.
- Var olan component, button, ekran, özellik vs. gibi şeyleri eğer üzerinde doğrudan çalışmıyorsak ve doğrudan oranın değişmesini ya da silinmesi söylenmediyse silmemelisin ya da kaldırmamalısın.
- Bir hata çıkması durumunda önce analiz etmelisin.
- Kodlarını clean kod olarak yazmalısın.
- Olabildiğince component yapısıyla parçalayarak ve daha okunaklı ve geliştirmeye açık şekilde yazmalısın.
- Component bazlı geliştirmelisin.
- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Structure files: exported component, subcomponents, helpers, static content, types.

# UI and Styling

- Use Shadcn UI, Radix, and Tailwind for components and styling.
- Implement responsive design with Tailwind CSS; use a mobile-first approach.
- Use Stylus as CSS Modules for component-specific styles:
- Create a .module.styl file for each component that needs custom styling.
- Use camelCase for class names in Stylus files.
- Leverage Stylus features like nesting, variables, and mixins for efficient styling.
- Implement a consistent naming convention for CSS classes (e.g., BEM) within Stylus modules.
- Use Tailwind for utility classes and rapid prototyping.
- Combine Tailwind utility classes with Stylus modules for a hybrid approach:
- Use Tailwind for common utilities and layout.
- Use Stylus modules for complex, component-specific styles.
- Never use the @apply directive

# File Structure for Styling

- Place Stylus module files next to their corresponding component files.
- Example structure:
  components/
  Button/
  Button.js
  Button.module.styl
  Card/
  Card.js
  Card.module.styl
