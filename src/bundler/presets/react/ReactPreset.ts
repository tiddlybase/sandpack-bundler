import { Bundler } from '../../bundler';
import { DepMap } from '../../module-registry';
import { Module } from '../../module/Module';
import { BabelTransformer } from '../../transforms/babel';
import { MDXTransformer } from '../../transforms/mdx';
import { CSSTransformer } from '../../transforms/css';
import { ReactRefreshTransformer } from '../../transforms/react-refresh';
import { StyleTransformer } from '../../transforms/style';
import { Preset } from '../Preset';


export class ReactPreset extends Preset {
  defaultHtmlBody = '<div id="root"></div>';

  constructor() {
    super('react');
  }



  async init(bundler: Bundler): Promise<void> {
    await super.init(bundler);

    await Promise.all([
      this.registerTransformer(new BabelTransformer()),
      this.registerTransformer(new ReactRefreshTransformer()),
      this.registerTransformer(new CSSTransformer()),
      this.registerTransformer(new StyleTransformer()),
      this.registerTransformer(new MDXTransformer()),
    ]);
  }

  mapTransformers(module: Module): Array<[string, any]> {
    if (/^(?!\/node_modules\/).*\.(((m|c)?jsx?)|tsx|mdx)$/.test(module.filepath)) {
      const transfomers: Array<[string, any]> = [
        [
          'babel-transformer',
          {
            presets: [
              [
                'react',
                {
                  runtime: 'automatic',
                },
              ],
            ],
            plugins: [
              ['react-refresh/babel', { skipEnvCheck: true }],
              '@babel/plugin-proposal-explicit-resource-management',
            ],
          },
        ],
        ['react-refresh-transformer', {}],
      ];
      if (module.filepath.endsWith('.mdx')) {
        transfomers.unshift(['mdx-transformer', {}])
      }
      return transfomers;
    }

    if (/\.(m|c)?(t|j)sx?$/.test(module.filepath) && !module.filepath.endsWith('.d.ts')) {
      return [
        [
          'babel-transformer',
          {
            presets: [
              [
                'react',
                {
                  runtime: 'automatic',
                },
              ],
            ],
          },
        ],
      ];
    }

    if (/\.css$/.test(module.filepath)) {
      return [
        ['css-transformer', {}],
        ['style-transformer', {}],
      ];
    }

    throw new Error(`No transformer for ${module.filepath}`);
  }

  augmentDependencies(dependencies: DepMap): DepMap {
    // TODO: add MDX deps here
    if (!dependencies['react-refresh']) {
      dependencies['react-refresh'] = '^0.11.0';
    }
    dependencies['core-js'] = '3.22.7';
    return dependencies;
  }
}
