import { Usuario } from '../models/usuario.model';

/**
 * Etapa 1 de la Práctica 8: emula la capa de servicios con datos en memoria.
 * Métodos y listado estáticos, como pide la consigna.
 */
export class UsuarioMockService {
  private static usuarios: Usuario[] = [
    {
      id: 1,
      dni: '30123456',
      apellido: 'Mantilla',
      nombres: 'Benjamín',
      domicilio: 'La Plata',
      genero: 'Masculino',
      email: 'admin.demo@jyaa.unlp.edu.ar',
      activo: true,
      roles: ['ADMINISTRADOR'],
      rolActual: 'ADMINISTRADOR',
    },
    {
      id: 2,
      dni: '28999888',
      apellido: 'Budnik',
      nombres: 'Lucas',
      domicilio: 'Berisso',
      genero: 'Masculino',
      email: 'participante.demo@jyaa.unlp.edu.ar',
      activo: true,
      roles: ['PARTICIPANTE'],
      rolActual: 'PARTICIPANTE',
    },
  ];

  private static nextId = 3;

  static listar(): Usuario[] {
    return [...this.usuarios];
  }

  static buscarPorId(id: number): Usuario | undefined {
    return this.usuarios.find((u) => u.id === id);
  }

  static alta(usuario: Usuario): Usuario {
    const nuevo: Usuario = {
      ...usuario,
      id: this.nextId++,
      activo: usuario.activo ?? true,
      roles: usuario.roles ?? ['PARTICIPANTE'],
      rolActual: usuario.rolActual ?? 'PARTICIPANTE',
    };
    this.usuarios.push(nuevo);
    return { ...nuevo };
  }

  static modificar(id: number, datos: Partial<Usuario>): Usuario | undefined {
    const idx = this.usuarios.findIndex((u) => u.id === id);
    if (idx < 0) {
      return undefined;
    }
    this.usuarios[idx] = { ...this.usuarios[idx], ...datos, id };
    return { ...this.usuarios[idx] };
  }

  static setActivo(id: number, activo: boolean): Usuario | undefined {
    return this.modificar(id, { activo });
  }

  static baja(id: number): boolean {
    const antes = this.usuarios.length;
    this.usuarios = this.usuarios.filter((u) => u.id !== id);
    return this.usuarios.length < antes;
  }
}
