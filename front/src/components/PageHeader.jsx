export function PageHeader({
  title,
  description,
  children,
  actions,
  className = '',
  titleClassName = '',
  descriptionClassName = '',
}) {
  const rightContent = actions || children;

  return (
    <header
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
    >
      <div>
        {typeof title === 'string' ? (
          <h1 className={`text-2xl font-bold tracking-tight ${titleClassName}`}>
            {title}
          </h1>
        ) : (
          title
        )}
        {description &&
          (typeof description === 'string' ? (
            <p
              className={`text-sm text-muted-foreground ${descriptionClassName}`}
            >
              {description}
            </p>
          ) : (
            description
          ))}
      </div>
      {rightContent && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{rightContent}</div>
      )}
    </header>
  );
}

export default PageHeader;
