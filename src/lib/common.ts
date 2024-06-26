// noinspection JSValidateJSDoc
import { Modules, Contracts } from '@youwol/vsf-core'
import { AnyVirtualDOM } from '@youwol/rx-vdom'
import { Observable } from 'rxjs'

// noinspection JSValidateJSDoc
export const schemaCommonBase = {
    /**
     * Defines the mapping function converting the data part of the incoming message to the associated virtual DOM.
     * Function arguments:
     * *  data: incoming message's data
     * *  module: instance of this module, see {@link module}
     * Return a Virtual DOM from [@youwol/flux-view](https://l.youwol.com/doc/@youwol/flux-view).
     *
     * Here is an example for a message that conveys data of type `{value, id}`:
     *
     * ```js
     * (data, module) => {
     *
     *      return {
     *          class: 'd-flex align-items-center',
     *          children:[
     *              {
     *                  innerText: data.id
     *              },
     *              {
     *                  innerText: data.value
     *              },
     *          ]
     *      }
     * }
     *
     * Default to the first matching element from the {@link VsfCore.Projects.Environment.viewsFactory}
     * tested against the message.
     */
    vdomMap: Modules.jsCodeAttribute({
        value: (
            data: unknown,
            module: Modules.ImplementationTrait,
        ): AnyVirtualDOM => {
            const factory = module.environment['viewsFactory'].find((factory) =>
                factory.isCompatible(data),
            )
            return factory.view(data)
        },
    }),

    /**
     * Exposes eventual outputs of the module.
     *
     * Outputs are referenced in the three attributes:
     *   *  **state**: encapsulates their declaration using observables
     *   *  **vDomMap**: declare the DOM's events that initiate the trigger
     *   *  **outputs**: exposed some of the state's observables as outputs.
     *
     * Here is a typical example for a message that conveys data of type `{value, id}`:
     * ```js
     * {
     *      state: {
     *          selected$: new Subject()
     *      },
     *      vDomMap: (message, module) => {
     *          return {
     *              class: 'd-flex align-items-center',
     *              children:[
     *                  { innerText: message.data.id },
     *                  { innerText: message.data.value },
     *              ],
     *              onClick: () => module.state.selected$.next(message.data.id)
     *      },
     *      outputs: (state) => ({
     *          selected$: state.selected$
     *      }),
     * }
     * ```
     *
     * Default to:
     * ```js
     *  () => ({})
     * ```
     */
    outputs: Modules.jsCodeAttribute(
        {
            value: (
                // eslint-disable-next-line unused-imports/no-unused-vars -- keep variable for documentation purpose
                state: StateCommon,
            ): {
                [k: string]: Observable<Modules.OutputMessage>
            } => ({}),
        },
        { override: 'final' },
    ),
    /**
     * Defines a state bound to the module, usually to define {@link outputs}.
     *
     * Default to:
     * ```js
     *  {}
     * ```
     */
    state: Modules.anyObjectAttribute(
        {
            value: {},
        },
        { override: 'final' },
    ),
}

// noinspection JSValidateJSDoc
export const configurationCommon = {
    schema: {
        ...schemaCommonBase,
        ...{
            /**
             * Defines the attributes applied on the container of the children elements created
             * using {@link vdomMap}, e.g.:
             * ```js
             * {
             *     class:'d-flex',
             *     style:{ minWidth:'200px'}
             * }
             * ```
             *
             * Default to:
             * ```js
             * {}
             * ```
             */
            containerAttributes: Modules.anyObjectAttribute({
                value: {
                    class: 'd-flex flex-column',
                },
            }),

            options: {
                /**
                 * Specifies how the children are ordered inside the parent container.
                 *
                 * Default to `()=>0` (ordered as messages reach the module).
                 */
                orderOperator: Modules.jsCodeAttribute({
                    value: (
                        // eslint-disable-next-line unused-imports/no-unused-vars -- keep variable for documentation purpose
                        data1,
                        // eslint-disable-next-line unused-imports/no-unused-vars -- keep variable for documentation purpose
                        data2,
                    ): number => 0,
                }),
            },
        },
    },
}

export const inputsCommon = {
    /**
     * Defines the input, incoming messages are meant to be converted into virtual DOM using
     * the `vDomMap` function of {@link configuration }.
     */
    input$: {
        description: 'the input stream',
        contract: Contracts.ofUnknown,
    },
}

export class StateCommon {
    constructor(params: { [k: string]: unknown }) {
        Object.assign(this, params)
    }
}

export function moduleCommon(fwdParams, configInstance, childrenStream) {
    type OutputMapper = Modules.OutputMapperArg<
        typeof configurationCommon.schema,
        typeof inputsCommon
    >
    return new Modules.Implementation(
        {
            configuration: configurationCommon,
            inputs: inputsCommon,
            outputs: (args: OutputMapper) => {
                return configInstance.outputs(args.state)
            },
            state: configInstance.state,
            html: (m) => {
                return {
                    ...configInstance.containerAttributes,
                    children: childrenStream(m, configInstance.vDomMap),
                }
            },
        },
        fwdParams,
    )
}
