"""Migración SAT"""
def migrate_sat_fields():
    """
    Ejecuta la migración desde Python.
    
    Uso:
        python -c "from app.services.sat_migrations import migrate_sat_fields; migrate_sat_fields()"
    """
    from sqlalchemy import text
    from app.database.database import engine
    
    # El nombre correcto de la tabla
    TABLA = "reservas_hotel"
    
    # Comandos SQL
    comandos = [
        f"ALTER TABLE {TABLA} ADD COLUMN sat_uuid VARCHAR(50) UNIQUE",
        f"ALTER TABLE {TABLA} ADD COLUMN sat_numero_factura VARCHAR(20)",
        f"ALTER TABLE {TABLA} ADD COLUMN sat_monto_iva DECIMAL(10, 2)",
        f"ALTER TABLE {TABLA} ADD COLUMN sat_total DECIMAL(10, 2)",
        f"ALTER TABLE {TABLA} ADD COLUMN sat_pdf_url VARCHAR(500)",
        f"ALTER TABLE {TABLA} ADD COLUMN sat_emitida_en DATETIME",
    ]
    
    indices = [
        f"CREATE INDEX idx_sat_uuid ON {TABLA}(sat_uuid)",
        f"CREATE INDEX idx_sat_numero_factura ON {TABLA}(sat_numero_factura)",
        f"CREATE INDEX idx_sat_emitida_en ON {TABLA}(sat_emitida_en)",
    ]
    
    with engine.connect() as connection:
        # Ejecutar columnas
        for cmd in comandos:
            try:
                connection.execute(text(cmd))
                print(f"✅ {cmd}")
            except Exception as e:
                if "already exists" in str(e) or "duplicate" in str(e):
                    print(f"⚠️  Columna ya existe: {cmd}")
                else:
                    print(f"❌ Error: {cmd}")
                    print(f"   {e}")
        
        # Ejecutar índices
        for idx in indices:
            try:
                connection.execute(text(idx))
                print(f"✅ {idx}")
            except Exception as e:
                if "already exists" in str(e):
                    print(f"⚠️  Índice ya existe")
                else:
                    print(f"⚠️  No se pudo crear índice: {e}")
        
        connection.commit()
        print("\n✅ Migración completada")



# ════════════════════════════════════════════════════════════════════════════
# VERIFICACIÓN
# ════════════════════════════════════════════════════════════════════════════

def verificar_migracion():
    """
    Verifica que los campos se agregaron correctamente.
    
    Uso:
        python -c "from app.services.sat_migrations import verificar_migracion; verificar_migracion()"
    """
    from sqlalchemy import text, inspect
    from app.database.database import engine
    
    inspector = inspect(engine)
    columnas = inspector.get_columns('reservas_hotel')
    
    print("📋 Columnas en tabla reservas_hotel:")
    print("=" * 60)
    
    campos_sat = ['sat_uuid', 'sat_numero_factura', 'sat_monto_iva', 
                  'sat_total', 'sat_pdf_url', 'sat_emitida_en']
    
    for col in columnas:
        nombre = col['name']
        tipo = col['type']
        nullable = "NULL" if col['nullable'] else "NOT NULL"
        
        if nombre in campos_sat:
            print(f"✅ {nombre}: {tipo} ({nullable})")
        elif nombre.startswith('sat_'):
            print(f"⚠️  {nombre}: {tipo} ({nullable})")
    
    print("=" * 60)
    
    # Contar campos SAT
    columnas_sat_actuales = [c['name'] for c in columnas if c['name'].startswith('sat_')]
    print(f"\nCampos SAT encontrados: {len(columnas_sat_actuales)}")
    print(f"Campos SAT esperados: {len(campos_sat)}")
    
    if len(columnas_sat_actuales) == len(campos_sat):
        print("✅ ¡MIGRACIÓN COMPLETADA CON ÉXITO!")
    else:
        print("❌ Faltan campos. Revisa el SQL.")
        print(f"\nFaltan: {set(campos_sat) - set(columnas_sat_actuales)}")

