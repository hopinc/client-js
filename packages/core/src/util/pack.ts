export enum IDS {
	INTEGER = 0,
	DOUBLE = 1,
	FLOAT = 2,
	STRING = 3,
	BINARY = 4,
}

interface Structure {
	name: string;
	unsigned: boolean;
	type: IDS;
	bitSize: number | null;
	byteSize: number | null;
	functions: {
		read: string;
		write: string;
	} | null;
}

interface State {
	buffer: Uint8Array | Buffer;
	raw: ArrayBuffer | Buffer;
	view?: DataView;
}

export class Pack {
	public readonly web;
	public readonly bigEndian;
	public readonly stringSize;
	public readonly stringMax;
	public readonly string_write;
	public readonly string_read;
	public readonly structure: Structure[];
	public _encoder?: TextEncoder;

	constructor(
		structure: string[],
		web = false,
		endianess = 'little',
		stringSize = 2,
	) {
		this.web = web;
		this.bigEndian = endianess === 'big';
		this.stringSize = stringSize;

		// eslint-disable-next-line
		this.stringMax = Math.pow(2, stringSize * 8) - 1;

		if (web) {
			this.string_write = `setUint${stringSize * 8}`;
			this.string_read = `getUint${stringSize * 8}`;
		} else {
			this.string_write = `writeUInt${stringSize * 8}${
				this.bigEndian ? 'BE' : 'LE'
			}`;
			this.string_read = `readUInt${stringSize * 8}${
				this.bigEndian ? 'BE' : 'LE'
			}`;
		}

		this.structure = structure.map(entry => {
			const struct: Partial<Structure> = {
				name: entry,
				unsigned: entry.startsWith('u'),
			};

			if (entry.startsWith('u') || entry.startsWith('i')) {
				struct.type = IDS.INTEGER;
				const number = entry.substring(struct.unsigned ? 4 : 3);
				struct.bitSize = parseInt(number, 10);
				struct.byteSize = struct.bitSize / 8;
			} else if (entry === 'string') {
				struct.byteSize = null;
				struct.type = IDS.STRING;
			} else if (entry === 'binary') {
				struct.byteSize = null;
				struct.type = IDS.BINARY;
			} else if (entry === 'double') {
				struct.type = IDS.DOUBLE;
				struct.byteSize = 8;
			} else if (entry === 'float') {
				struct.type = IDS.FLOAT;
				struct.byteSize = 4;
			} else {
				throw new Error(`Unknown type ${entry}`);
			}

			if (struct.type !== IDS.STRING) {
				struct.functions = this._getFuncNames(
					struct.bitSize as Structure['bitSize'],
					struct.unsigned,
					struct.type,
				);
			}

			return struct as Structure;
		});
	}

	_getByteSize(structEntry: Structure, value?: string) {
		if (
			value &&
			(structEntry.type === IDS.STRING || structEntry.type === IDS.BINARY)
		) {
			return value.length + this.stringSize;
		}

		return structEntry.byteSize;
	}

	pack(values: string[]) {
		const {web} = this;

		if (values.length !== this.structure.length) {
			return null;
		}

		const sizes = [];
		let totalSize = 0;

		const cpy: Array<string | Buffer | Uint8Array> = [...values];

		for (let i = 0; i < this.structure.length; i++) {
			const entry = this.structure[i];
			const value = cpy[i];

			if (entry.type === IDS.STRING) {
				if (this.web && !this._encoder) {
					this._encoder = new TextEncoder();
				}

				cpy[i] =
					this.web && this._encoder
						? this._encoder.encode(value as string)
						: Buffer.from(value as string, 'utf-8');

				if (cpy[i].length > this.stringMax) {
					throw new Error('string length over max!');
				}
			}

			const elemSize = this._getByteSize(entry, cpy[i]);
			totalSize += elemSize;

			sizes.push(elemSize);
		}

		const state: Partial<State> = {};

		if (web) {
			const buffer = new ArrayBuffer(totalSize);
			state.buffer = new Uint8Array(buffer);
			state.raw = buffer;
			state.view = new DataView(buffer);
		} else {
			state.buffer = Buffer.alloc(totalSize);
			state.raw = state.buffer;
		}

		let offset = 0;
		for (let i = 0; i < this.structure.length; i++) {
			const entry = this.structure[i];
			const value = cpy[i];
			this._packValue(state, entry, value, offset);
			offset += sizes[i] ?? 0;
		}

		return state.raw;
	}

	unpack(buffer: Buffer) {
		const state: Partial<State> = {};
		const values = [];

		if (this.web) {
			state.buffer = new Uint8Array(buffer);
			state.raw = buffer;
			state.view = new DataView(buffer);
		} else {
			state.buffer = buffer;
			state.raw = state.buffer;
		}

		let offset = 0;

		for (const entry of this.structure) {
			if (entry.type === IDS.STRING) {
				const bufferValue = this._parseValue(state, entry, offset);

				if (this.web && !this._decoder) {
					this._decoder = new TextDecoder();
				}

				const string = this.web
					? this._decoder.decode(bufferValue)
					: bufferValue.toString('utf-8');

				values.push(string);
				offset += bufferValue.length + this.stringSize;
			} else if (entry.type === IDS.BINARY) {
				const bufferValue = this._parseValue(state, entry, offset);

				values.push(bufferValue);
				offset += bufferValue.length + this.stringSize;
			} else {
				const size = this._getByteSize(entry);

				values.push(this._parseValue(state, entry, offset));
				offset += size;
			}
		}

		return values;
	}

	_parseValue(buffer: State, structEntry: Structure, offset: number) {
		const {web} = this;

		if (structEntry.type === IDS.STRING || structEntry.type === IDS.BINARY) {
			let length: number;
			if (web && buffer.view) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				length = buffer.view[this.string_read](offset, !this.bigEndian);
			} else {
				length = buffer.buffer[this.string_read](offset);
			}

			return buffer.buffer.subarray(
				offset + this.stringSize,
				offset + this.stringSize + length,
			);
		}
		if (
			structEntry.type === IDS.INTEGER ||
			structEntry.type === IDS.FLOAT ||
			structEntry.type === IDS.DOUBLE
		) {
			if (web)
				return buffer.view[structEntry.functions.read](offset, !this.bigEndian);
			else return buffer.buffer[structEntry.functions.read](offset);
		}
		return null;
	}

	_getFuncNames(number: number | null, unsigned, type) {
		if (type === IDS.FLOAT) {
			if (this.web) {
				return {
					read: 'getFloat32',
					write: 'setFloat32',
				};
			}

			return {
				write: `writeFloat${this.bigEndian ? 'BE' : 'LE'}`,
				read: `readFloat${this.bigEndian ? 'BE' : 'LE'}`,
			};
		}

		if (type === IDS.DOUBLE) {
			if (this.web) {
				return {
					read: 'getFloat64',
					write: 'setFloat64',
				};
			}

			return {
				write: `writeDouble${this.bigEndian ? 'BE' : 'LE'}`,
				read: `readDouble${this.bigEndian ? 'BE' : 'LE'}`,
			};
		}

		if (type === IDS.INTEGER && number) {
			if (this.web) {
				return {
					write: `set${number === 64 ? 'Big' : ''}${
						unsigned ? 'Uint' : 'Int'
					}${number}`,
					read: `get${number === 64 ? 'Big' : ''}${
						unsigned ? 'Uint' : 'Int'
					}${number}`,
				};
			}

			return {
				write: `write${number === 64 ? 'Big' : ''}${
					unsigned ? 'U' : ''
				}Int${number}${number === 8 ? '' : this.bigEndian ? 'BE' : 'LE'}`,
				read: `read${number === 64 ? 'Big' : ''}${
					unsigned ? 'U' : ''
				}Int${number}${number === 8 ? '' : this.bigEndian ? 'BE' : 'LE'}`,
			};
		}

		return null;
	}

	_packValue(buffer, structEntry, value, offset) {
		if (structEntry.type === IDS.STRING || structEntry.type === IDS.BINARY) {
			if (this.web) {
				buffer.view[this.string_write](offset, value.length, !this.bigEndian);
				buffer.buffer.set(value, offset + this.stringSize);
			} else {
				buffer.buffer[this.string_write](value.length, offset);
				value.copy(buffer.buffer, offset + this.stringSize);
			}

			return true;
		}

		if (
			structEntry.type === IDS.INTEGER ||
			structEntry.type === IDS.FLOAT ||
			structEntry.type === IDS.DOUBLE
		) {
			if (this.web) {
				buffer.view[structEntry.functions.write](
					offset,
					value,
					!this.bigEndian,
				);
			} else {
				buffer.buffer[structEntry.functions.write](value, offset);
			}

			return true;
		}

		return false;
	}
}
