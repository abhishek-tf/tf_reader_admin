import Icon from './Icon.jsx';

const VARIANT_CLASS = {
  primary: 'btn btn-primary',
  secondary: 'btn',
  ghost: 'btn btn-ghost',
  dangerGhost: 'btn btn-danger-ghost',
};

/**
 * The one button component for the console, matching Stitch's two button styles: a solid
 * Ultramarine primary and a white/Cloud-border secondary. `ghost` and `dangerGhost` cover the
 * borderless icon-row actions Stitch uses inside tables and cards (e.g. "Edit", "Deactivate").
 *
 * Disabled while a mutation is in flight is the caller's job (pass `disabled`), same as the
 * rest of the console — this component does not know what "saving" means for any given form.
 *
 * `as` renders the same look on something other than a `<button>` — react-router's `Link`,
 * most often, for a primary action that navigates (e.g. "New publisher") rather than submits
 * or mutates. Defaults to `'button'`, so every existing caller is unaffected. `type` is
 * dropped for a non-button tag: `Link` does not accept it, and passing it through triggers a
 * React DOM warning.
 */
export default function Button({
  children,
  variant = 'secondary',
  size,
  icon,
  as: Component = 'button',
  type = 'button',
  className = '',
  ...rest
}) {
  const classes = [VARIANT_CLASS[variant] ?? VARIANT_CLASS.secondary];
  if (size === 'sm') classes.push('btn-sm');
  if (className) classes.push(className);

  const typeProp = Component === 'button' ? { type } : {};

  return (
    <Component className={classes.join(' ')} {...typeProp} {...rest}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </Component>
  );
}
